import datetime
from io import BytesIO

from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.shortcuts import get_object_or_404
from django.utils import timezone
from PIL import Image

from atendimentos.models import OrdemServico, MidiaOrdemServico, Servico, Veiculo, TagPeca, IncidenteOS

# Constantes de negócio
MAX_FOTOS_POR_MOMENTO = 5
MAX_DIMENSAO_PX = 1920
QUALIDADE_JPEG = 85

HORARIO_ABERTURA = datetime.time(8, 0)
HORARIO_FECHAMENTO = datetime.time(18, 0)
SLOT_MINUTOS = 30


class MidiaOrdemServicoService:
    """Serviço responsável pelo processamento de upload de mídias."""

    MAPA_STATUS_MOMENTO_PERMITIDO = {
        'PATIO': ['VISTORIA_GERAL', 'AVARIA_PREVIA'],
        'VISTORIA_INICIAL': ['VISTORIA_GERAL', 'AVARIA_PREVIA'],
        'EM_EXECUCAO': ['EXECUCAO'],
        'LIBERACAO': ['FINALIZADO'],
        'BLOQUEADO_INCIDENTE': ['EXECUCAO'],
    }

    @staticmethod
    def processar_upload_multiplo(ordem_servico, momento, arquivos):
        """RF-05/RF-06: Processa upload validando limites e matriz de status vs momento."""
        status_os = ordem_servico.status
        momentos_permitidos = MidiaOrdemServicoService.MAPA_STATUS_MOMENTO_PERMITIDO.get(status_os, [])

        if momento not in momentos_permitidos:
            raise ValidationError(
                f'Momento "{momento}" não é permitido para uma OS com status "{ordem_servico.get_status_display()}".'
            )

        fotos_existentes = MidiaOrdemServico.objects.filter(
            ordem_servico=ordem_servico,
            momento=momento,
        ).count()

        if fotos_existentes + len(arquivos) > MAX_FOTOS_POR_MOMENTO:
            vagas = MAX_FOTOS_POR_MOMENTO - fotos_existentes
            raise ValidationError(f'Limite de {MAX_FOTOS_POR_MOMENTO} fotos atingido. Pode enviar mais {max(vagas, 0)}.')

        arquivos_processados = [
            MidiaOrdemServicoService._comprimir_imagem(arq)
            for arq in arquivos
        ]

        midias = [
            MidiaOrdemServico(ordem_servico=ordem_servico, arquivo=arq, momento=momento)
            for arq in arquivos_processados
        ]

        for midia in midias:
            midia.save()

        return midias

    @staticmethod
    def _comprimir_imagem(arquivo):
        """Redimensiona e otimiza imagens via Pillow."""
        img = Image.open(arquivo)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')

        if img.width > MAX_DIMENSAO_PX or img.height > MAX_DIMENSAO_PX:
            img.thumbnail((MAX_DIMENSAO_PX, MAX_DIMENSAO_PX), Image.LANCZOS)

        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=QUALIDADE_JPEG, optimize=True)
        buffer.seek(0)

        nome_original = getattr(arquivo, 'name', 'foto.jpg')
        nome_saida = f"{nome_original.rsplit('.', 1)[0]}.jpg"

        return InMemoryUploadedFile(
            file=buffer, field_name='arquivo', name=nome_saida,
            content_type='image/jpeg', size=buffer.getbuffer().nbytes, charset=None,
        )


class OrdemServicoService:
    """Serviço responsável pelas operações de criação e transição de Ordens de Serviço."""

    @staticmethod
    def listar_historico_por_periodo(funcionario, data_inicial, data_final, status='todos'):
        """RF-10: Lista histórico restrito ao funcionário com validação de datas."""
        if data_inicial > data_final:
            raise ValidationError("A data inicial não pode ser maior que a data final.")

        filtros = {
            'funcionario': funcionario,
            'data_hora__date__gte': data_inicial,
            'data_hora__date__lte': data_final,
        }
        if status and status != 'todos':
            filtros['status'] = status

        return OrdemServico.objects.filter(**filtros).select_related('veiculo', 'servico').order_by('-data_hora')

    @staticmethod
    def verificar_conflito(data_hora, duracao):
        """Verifica sobreposição de horários no pátio."""
        fim = data_hora + duracao
        conflitos = OrdemServico.objects.filter(
            data_hora__date=data_hora.date(),
            status__in=['PATIO', 'VISTORIA_INICIAL', 'EM_EXECUCAO']
        ).select_related('servico')

        for os in conflitos:
            os_inicio = timezone.localtime(os.data_hora)
            os_fim = os_inicio + datetime.timedelta(minutes=os.servico.duracao_estimada_min)
            if data_hora < os_fim and os_inicio < fim:
                raise ValidationError(f'Conflito com OS das {os_inicio.strftime("%H:%M")} às {os_fim.strftime("%H:%M")}.')

    @staticmethod
    def criar_com_veiculo(dados, funcionario):
        """Cria OS garantindo apenas uma ativa por vez."""
        servico = get_object_or_404(Servico, pk=dados['servico_id'])
        OrdemServicoService.verificar_conflito(dados['data_hora'], datetime.timedelta(minutes=servico.duracao_estimada_min))

        veiculo, _ = Veiculo.objects.update_or_create(
            placa=dados['placa'],
            defaults={k: dados[k] for k in ['modelo', 'marca', 'cor', 'nome_dono', 'celular_dono']}
        )

        iniciar_agora = dados.get('iniciar_agora', False)
        if iniciar_agora:
            if OrdemServico.objects.filter(funcionario=funcionario, status='EM_EXECUCAO').exists():
                raise ValidationError('O funcionário já possui uma OS em execução.')

        return OrdemServico.objects.create(
            veiculo=veiculo, servico=servico, funcionario=funcionario,
            data_hora=dados['data_hora'],
            horario_inicio=timezone.now() if iniciar_agora else None,
            status='VISTORIA_INICIAL' if iniciar_agora else 'PATIO',
            observacoes=dados.get('observacoes', ''),
        )

    @staticmethod
    def avancar_etapa(os_id: int, dados: dict) -> OrdemServico:
        """Máquina de Estados Industrial: Gere transições e horários."""
        os = get_object_or_404(OrdemServico, id=os_id)
        status_atual = os.status
        agora = timezone.now()

        # ETAPA 1: PATIO -> VISTORIA_INICIAL (Valida fotos obrigatórias de vistoria)
        if status_atual == 'PATIO' or (status_atual == 'VISTORIA_INICIAL' and not os.horario_lavagem):
            contagem_fotos = MidiaOrdemServico.objects.filter(
                ordem_servico=os,
                momento='VISTORIA_GERAL'
            ).count()

            if contagem_fotos < 5:
                raise ValueError(f"Ação negada: mínimo de 5 fotos de vistoria exigidas. (Atual: {contagem_fotos})")

            os.status = 'VISTORIA_INICIAL'
            os.laudo_vistoria = dados.get('laudo_vistoria', '')
            os.horario_lavagem = agora
            os.save()

        # ETAPA 2: VISTORIA_INICIAL -> EM_EXECUCAO
        elif os.horario_lavagem and not os.horario_acabamento:
            os.comentario_lavagem = dados.get('comentario_lavagem', '')
            os.status = 'EM_EXECUCAO'
            os.horario_acabamento = agora
            os.save()

        # ETAPA 3: EM_EXECUCAO -> LIBERACAO
        elif os.horario_acabamento:
            os.comentario_acabamento = dados.get('comentario_acabamento', '')
            os.status = 'LIBERACAO'
            os.save()

        return os

    @staticmethod
    def finalizar_ordem_servico_industrial(os_id: int, dados: dict) -> OrdemServico:
        """Etapa 4: Finalização com validação de fotos de entrega e vaga."""
        os = get_object_or_404(OrdemServico, id=os_id)

        if MidiaOrdemServico.objects.filter(ordem_servico=os, momento='FINALIZADO').count() < 5:
            raise ValueError("5 fotos de entrega exigidas.")

        if not dados.get('vaga_patio'):
            raise ValueError("A vaga de saída é obrigatória.")

        os.status = 'FINALIZADO'
        os.vaga_patio = dados.get('vaga_patio')
        os.horario_finalizacao = timezone.now()
        os.save()

        return os


class IncidenteService:
    """Serviço para isolar o fluxo de erros e incidentes operacionais."""

    @staticmethod
    def registrar_incidente(os_id, dados, arquivo_foto):
        """Registra o incidente, vincula a peça afetada e bloqueia a OS."""
        os = get_object_or_404(OrdemServico, id=os_id)
        tag_peca = get_object_or_404(TagPeca, id=dados.get('tag_peca_id'))

        foto_processada = MidiaOrdemServicoService._comprimir_imagem(arquivo_foto)

        incidente = IncidenteOS.objects.create(
            ordem_servico=os,
            tag_peca=tag_peca,
            descricao=dados.get('descricao'),
            foto_url=foto_processada,
            resolvido=False
        )

        os.status = 'BLOQUEADO_INCIDENTE'
        os.save()

        return incidente