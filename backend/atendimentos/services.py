"""
Camada de serviço — atendimentos.

Toda lógica de negócio do app fica isolada aqui.
Views delegam para estes métodos; nunca implementam regras diretamente.
"""
import datetime
from io import BytesIO

from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.shortcuts import get_object_or_404
from django.utils import timezone
from PIL import Image

from atendimentos.models import Atendimento, MidiaAtendimento, Servico, Veiculo

# Constantes de negócio
MAX_FOTOS_POR_MOMENTO = 5
MAX_DIMENSAO_PX = 1920
QUALIDADE_JPEG = 85

HORARIO_ABERTURA = datetime.time(8, 0)
HORARIO_FECHAMENTO = datetime.time(18, 0)
SLOT_MINUTOS = 30


class MidiaAtendimentoService:
    """Serviço responsável pelo processamento de upload de mídias."""

    # Status que permitem receber novas mídias
    STATUS_PERMITIDOS = {'agendado', 'em_andamento'}

    @staticmethod
    def processar_upload_multiplo(atendimento, momento, arquivos):
        """
        Processa o upload de múltiplos arquivos de mídia para um atendimento.

        Args:
            atendimento: instância de Atendimento
            momento: str — 'ANTES' ou 'DEPOIS'
            arquivos: lista de UploadedFile (imagens)

        Returns:
            list[MidiaAtendimento] — objetos criados

        Raises:
            ValidationError: se o status do atendimento não permitir uploads
            ValidationError: se o limite de 5 fotos por momento for excedido
        """
        if atendimento.status not in MidiaAtendimentoService.STATUS_PERMITIDOS:
            raise ValidationError(
                f'Não é possível enviar mídias para um atendimento com status '
                f'"{atendimento.get_status_display()}". '
                f'Status permitidos: agendado, em andamento.'
            )

        # Validação de limite de fotos por momento (RF-05/RF-06)
        fotos_existentes = MidiaAtendimento.objects.filter(
            atendimento=atendimento,
            momento=momento,
        ).count()

        total_apos_upload = fotos_existentes + len(arquivos)

        if total_apos_upload > MAX_FOTOS_POR_MOMENTO:
            vagas = MAX_FOTOS_POR_MOMENTO - fotos_existentes
            raise ValidationError(
                f'Limite de {MAX_FOTOS_POR_MOMENTO} fotos por momento atingido. '
                f'Já existem {fotos_existentes} foto(s) "{momento}". '
                f'Você pode enviar no máximo mais {max(vagas, 0)}.'
            )

        # Compressão e normalização via Pillow
        arquivos_processados = [
            MidiaAtendimentoService._comprimir_imagem(arq)
            for arq in arquivos
        ]

        midias = [
            MidiaAtendimento(
                atendimento=atendimento,
                arquivo=arquivo,
                momento=momento,
            )
            for arquivo in arquivos_processados
        ]

        for midia in midias:
            midia.save()

        return midias

    @staticmethod
    def _comprimir_imagem(arquivo):
        """
        Abre a imagem com Pillow, redimensiona se necessário (max 1920px)
        e salva com quality=85 em JPEG. Retorna um InMemoryUploadedFile.

        Imagens menores que o limite não sofrem upscale.
        """
        img = Image.open(arquivo)

        # Converte RGBA/P para RGB (JPEG não suporta transparência)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')

        # Redimensiona apenas se exceder o limite (sem upscale)
        if img.width > MAX_DIMENSAO_PX or img.height > MAX_DIMENSAO_PX:
            img.thumbnail((MAX_DIMENSAO_PX, MAX_DIMENSAO_PX), Image.LANCZOS)

        # Salva em buffer JPEG com qualidade controlada
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=QUALIDADE_JPEG, optimize=True)
        buffer.seek(0)

        # Determina o nome do arquivo de saída
        nome_original = getattr(arquivo, 'name', 'foto.jpg')
        nome_base = nome_original.rsplit('.', 1)[0]
        nome_saida = f'{nome_base}.jpg'

        return InMemoryUploadedFile(
            file=buffer,
            field_name='arquivo',
            name=nome_saida,
            content_type='image/jpeg',
            size=buffer.getbuffer().nbytes,
            charset=None,
        )


class AtendimentoService:
    """Serviço responsável pelas operações de criação de atendimentos."""

    @staticmethod
    def listar_historico_por_periodo(funcionario, data_inicial, data_final, status='todos'):
        """
        RF-10: Lista o histÃ³rico de atendimentos finalizados do funcionÃ¡rio por perÃ­odo.

        O intervalo Ã© inclusivo nas duas pontas e sempre restrito ao usuÃ¡rio logado,
        evitando exposiÃ§Ã£o de dados de outros funcionÃ¡rios.
        """
        hoje = timezone.localdate()
        if data_inicial > data_final:
            raise ValidationError('A data inicial nÃ£o pode ser maior que a data final.')
        if data_inicial > hoje or data_final > hoje:
            raise ValidationError('O periodo do historico nao pode incluir datas futuras.')

        filtros = {
            'funcionario': funcionario,
            'data_hora__date__gte': data_inicial,
            'data_hora__date__lte': data_final,
        }
        if status and status != 'todos':
            filtros['status'] = status

        return (
            Atendimento.objects.filter(**filtros)
            .select_related('veiculo', 'servico')
            .prefetch_related('midias')
            .order_by('-data_hora')
        )

    @staticmethod
    def verificar_conflito(data_hora, duracao):
        """Verifica se o novo horário entra em conflito com algum atendimento ativo (agendado/em andamento)."""
        fim = data_hora + duracao
        
        conflitos = Atendimento.objects.filter(
            data_hora__date=data_hora.date(),
            status__in=['agendado', 'em_andamento']
        ).select_related('servico')

        for a in conflitos:
            a_inicio = timezone.localtime(a.data_hora)
            a_fim = a_inicio + datetime.timedelta(minutes=a.servico.duracao_estimada_min)
            
            # (StartA < EndB) and (StartB < EndA) logic
            if data_hora < a_fim and a_inicio < fim:
                raise ValidationError(
                    f'O horário selecionado entra em conflito com outro atendimento já agendado '
                    f'(das {a_inicio.strftime("%H:%M")} às {a_fim.strftime("%H:%M")}).'
                )

    @staticmethod
    def get_horarios_livres(data_str, servico_id):
        """Gera a lista de slots de horários vagos no dia."""
        servico = get_object_or_404(Servico, pk=servico_id)
        duracao = datetime.timedelta(minutes=servico.duracao_estimada_min)

        from django.utils.dateparse import parse_date
        data = parse_date(data_str)
        if not data:
            raise ValidationError('Data inválida.')

        atendimentos_ativos = Atendimento.objects.filter(
            data_hora__date=data,
            status__in=['agendado', 'em_andamento']
        ).select_related('servico')

        ocupados = []
        for a in atendimentos_ativos:
            inicio = timezone.localtime(a.data_hora)
            fim = inicio + datetime.timedelta(minutes=a.servico.duracao_estimada_min)
            ocupados.append((inicio, fim))

        horarios_livres = []
        current_time = timezone.make_aware(datetime.datetime.combine(data, HORARIO_ABERTURA))
        fim_expediente = timezone.make_aware(datetime.datetime.combine(data, HORARIO_FECHAMENTO))

        while current_time + duracao <= fim_expediente:
            slot_inicio = current_time
            slot_fim = current_time + duracao

            if slot_inicio < timezone.localtime():
                current_time += datetime.timedelta(minutes=SLOT_MINUTOS)
                continue

            conflito = False
            for oc_inicio, oc_fim in ocupados:
                if slot_inicio < oc_fim and oc_inicio < slot_fim:
                    conflito = True
                    break
            
            if not conflito:
                horarios_livres.append(slot_inicio.strftime('%H:%M'))
            
            current_time += datetime.timedelta(minutes=SLOT_MINUTOS)

        return horarios_livres

    @staticmethod
    def criar_com_veiculo(dados, funcionario):
        """
        Cria (ou reutiliza) um veículo pela placa e registra um novo atendimento.

        Args:
            dados: dict com os campos validados pelo CriarAtendimentoSerializer.
            funcionario: instância de User (quem está criando o atendimento).

        Returns:
            Atendimento — instância criada.

        Raises:
            Http404: se o servico_id não corresponder a nenhum Servico.
            ValidationError: se houver conflito de horário.
        """
        servico = get_object_or_404(Servico, pk=dados['servico_id'])

        AtendimentoService.verificar_conflito(
            data_hora=dados['data_hora'],
            duracao=datetime.timedelta(minutes=servico.duracao_estimada_min)
        )

        veiculo, _ = Veiculo.objects.update_or_create(
            placa=dados['placa'],
            defaults={
                'modelo':      dados['modelo'],
                'marca':       dados['marca'],
                'cor':         dados['cor'],
                'nome_dono':   dados['nome_dono'],
                'celular_dono': dados['celular_dono'],
            },
        )

        iniciar_agora = dados.get('iniciar_agora', False)

        if iniciar_agora:
            if Atendimento.objects.filter(
                funcionario=funcionario, 
                status='em_andamento',
                data_hora__date=dados['data_hora'].date()
            ).exists():
                raise ValidationError('O funcionário já possui um atendimento em andamento hoje. Termine o atendimento atual antes de iniciar outro.')

        return Atendimento.objects.create(
            veiculo=veiculo,
            servico=servico,
            funcionario=funcionario,
            data_hora=dados['data_hora'],
            horario_inicio=timezone.now() if iniciar_agora else None,
            status='em_andamento' if iniciar_agora else 'agendado',
            observacoes=dados.get('observacoes', ''),
        )

    @staticmethod
    def finalizar(atendimento):
        """
        RF-06: Finaliza um atendimento em andamento verificando restrições de negócio.
        
        Raises:
            ValidationError se o atendimento não estiver em andamento ou 
            não possuir fotos do momento DEPOIS.
        """
        if atendimento.status != 'em_andamento':
            raise ValidationError('Apenas atendimentos em andamento podem ser finalizados.')

        if not atendimento.midias.filter(momento='DEPOIS').exists():
            raise ValidationError('Não é possível finalizar sem enviar as fotos do DEPOIS.')

        atendimento.status = 'finalizado'
        # Salva para ativar possíveis signals do Django
        atendimento.save()
        return atendimento
