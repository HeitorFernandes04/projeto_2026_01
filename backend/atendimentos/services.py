import datetime
from io import BytesIO

from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.shortcuts import get_object_or_404
from django.utils import timezone
from PIL import Image

from atendimentos.models import Atendimento, MidiaAtendimento, Servico, Veiculo, TagPeca, IncidenteOS

# Constantes de negócio (Axioma 4)
MAX_FOTOS_POR_MOMENTO = 5
MAX_DIMENSAO_PX = 1920
QUALIDADE_JPEG = 85

HORARIO_ABERTURA = datetime.time(8, 0)
HORARIO_FECHAMENTO = datetime.time(18, 0)
SLOT_MINUTOS = 30


class MidiaAtendimentoService:
    """Serviço responsável pelo processamento de upload de mídias."""

    # Status permitidos expandidos para suportar incidentes
    STATUS_PERMITIDOS = {'agendado', 'em_andamento', 'incidente'}

    @staticmethod
    def processar_upload_multiplo(atendimento, momento, arquivos):
        """RF-05/RF-06: Processa upload validando limites e novas categorias de momento."""
        if atendimento.status not in MidiaAtendimentoService.STATUS_PERMITIDOS:
            raise ValidationError(
                f'Não é possível enviar mídias para um atendimento com status "{atendimento.get_status_display()}".'
            )

        fotos_existentes = MidiaAtendimento.objects.filter(
            atendimento=atendimento,
            momento=momento,
        ).count()

        if fotos_existentes + len(arquivos) > MAX_FOTOS_POR_MOMENTO:
            vagas = MAX_FOTOS_POR_MOMENTO - fotos_existentes
            raise ValidationError(f'Limite de {MAX_FOTOS_POR_MOMENTO} fotos atingido. Pode enviar mais {max(vagas, 0)}.')

        arquivos_processados = [
            MidiaAtendimentoService._comprimir_imagem(arq)
            for arq in arquivos
        ]

        midias = [
            MidiaAtendimento(atendimento=atendimento, arquivo=arq, momento=momento)
            for arq in arquivos_processados
        ]

        for midia in midias:
            midia.save()

        return midias

    @staticmethod
    def _comprimir_imagem(arquivo):
        """Redimensiona e otimiza imagens via Pillow (Axioma 4)."""
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


class AtendimentoService:
    """Serviço responsável pelas operações de criação e transição de atendimentos."""

    @staticmethod
    def listar_historico_por_periodo(funcionario, data_inicial, data_final, status='todos'):
        """RF-10: Lista histórico restrito ao funcionário (Segurança)."""
        filtros = {
            'funcionario': funcionario,
            'data_hora__date__gte': data_inicial,
            'data_hora__date__lte': data_final,
        }
        if status and status != 'todos':
            filtros['status'] = status

        return Atendimento.objects.filter(**filtros).select_related('veiculo', 'servico').order_by('-data_hora')

    @staticmethod
    def verificar_conflito(data_hora, duracao):
        """Verifica sobreposição de horários no pátio."""
        fim = data_hora + duracao
        conflitos = Atendimento.objects.filter(
            data_hora__date=data_hora.date(),
            status__in=['agendado', 'em_andamento']
        ).select_related('servico')

        for a in conflitos:
            a_inicio = timezone.localtime(a.data_hora)
            a_fim = a_inicio + datetime.timedelta(minutes=a.servico.duracao_estimada_min)
            if data_hora < a_fim and a_inicio < fim:
                raise ValidationError(f'Conflito com atendimento das {a_inicio.strftime("%H:%M")} às {a_fim.strftime("%H:%M")}.')

    @staticmethod
    def criar_com_veiculo(dados, funcionario):
        """Cria atendimento/OS garantindo apenas um ativo por vez."""
        servico = get_object_or_404(Servico, pk=dados['servico_id'])
        AtendimentoService.verificar_conflito(dados['data_hora'], datetime.timedelta(minutes=servico.duracao_estimada_min))

        veiculo, _ = Veiculo.objects.update_or_create(
            placa=dados['placa'],
            defaults={k: dados[k] for k in ['modelo', 'marca', 'cor', 'nome_dono', 'celular_dono']}
        )

        iniciar_agora = dados.get('iniciar_agora', False)
        if iniciar_agora:
            if Atendimento.objects.filter(funcionario=funcionario, status='em_andamento').exists():
                raise ValidationError('O funcionário já possui um atendimento em andamento.')

        return Atendimento.objects.create(
            veiculo=veiculo, servico=servico, funcionario=funcionario,
            data_hora=dados['data_hora'],
            horario_inicio=timezone.now() if iniciar_agora else None,
            status='em_andamento' if iniciar_agora else 'agendado',
            observacoes=dados.get('observacoes', ''),
        )

    @staticmethod
    def avancar_etapa(atendimento_id: int, dados: dict) -> Atendimento:
        """Máquina de Estados Industrial: Gere transições e horários."""
        atendimento = get_object_or_404(Atendimento, id=atendimento_id)
        status_atual = atendimento.status
        agora = timezone.now()

        # ETAPA 1: Vistoria -> Lavagem
        if status_atual == 'agendado' or (status_atual == 'em_andamento' and not atendimento.horario_lavagem):
            atendimento.status = 'em_andamento'
            atendimento.laudo_vistoria = dados.get('laudo_vistoria', '')
            atendimento.horario_lavagem = agora
            atendimento.save()

        # ETAPA 2: Lavagem -> Acabamento
        elif atendimento.horario_lavagem and not atendimento.horario_acabamento:
            atendimento.comentario_lavagem = dados.get('comentario_lavagem', '')
            atendimento.horario_acabamento = agora
            atendimento.save()

        # ETAPA 3: Acabamento -> Liberação
        elif atendimento.horario_acabamento:
            atendimento.comentario_acabamento = dados.get('comentario_acabamento', '')
            atendimento.save()

        return atendimento
    
    @staticmethod
    def finalizar_atendimento_industrial(atendimento_id: int, dados: dict) -> Atendimento:
        """Etapa 4: Finalização com validação de fotos de entrega e Vaga."""
        atendimento = get_object_or_404(Atendimento, id=atendimento_id)
        
        # Validação conforme RN-13 (Momento FINALIZADO na nova estrutura)
        if MidiaAtendimento.objects.filter(atendimento=atendimento, momento='FINALIZADO').count() < 5:
            raise ValueError("5 fotos de entrega exigidas.")
        
        if not dados.get('vaga_patio'):
            raise ValueError("A vaga de saída é obrigatória.")

        atendimento.status = 'finalizado'
        atendimento.vaga_patio = dados.get('vaga_patio')
        atendimento.horario_finalizacao = timezone.now()
        atendimento.save()
        
        return atendimento


class IncidenteService:
    """Serviço para isolar o fluxo de erros e incidentes operacionais."""

    @staticmethod
    def registrar_incidente(atendimento_id, dados, arquivo_foto):
        """
        Registra o incidente, vincula a peça afetada e bloqueia a OS.
        """
        atendimento = get_object_or_404(Atendimento, id=atendimento_id)
        tag_peca = get_object_or_404(TagPeca, id=dados.get('tag_peca_id'))

        # Processa a foto da evidência usando a mesma lógica de compressão
        foto_processada = MidiaAtendimentoService._comprimir_imagem(arquivo_foto)

        incidente = IncidenteOS.objects.create(
            atendimento=atendimento,
            tag_peca=tag_peca,
            descricao=dados.get('descricao'),
            foto_url=foto_processada,
            resolvido=False
        )

        # Atualiza status da OS para bloquear o operador (Fluxo de Exceção)
        atendimento.status = 'incidente'
        atendimento.save()

        return incidente