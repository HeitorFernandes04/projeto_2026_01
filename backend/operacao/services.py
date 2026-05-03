import datetime
from io import BytesIO
from django.core.exceptions import PermissionDenied, ValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from PIL import Image
from core.models import Servico, Veiculo, TagPeca, VistoriaItem
from accounts.models import Estabelecimento
from operacao.models import OrdemServico, MidiaOrdemServico, IncidenteOS

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
                f'Momento "{momento}" não é permitido para uma OS com status "{ordem_servico.status}".'
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
        """Valida se o slot está disponível e não é retroativo."""
        if data_hora < timezone.now():
            raise ValidationError('Não é possível agendar para uma data ou horário retroativo.')

        fim = data_hora + duracao
        
        # Trava Rígida (REQUISITOS_RF22_HORARIOS.pdf - 1.2)
        limite_operacional = data_hora.replace(hour=18, minute=0, second=0, microsecond=0)
        if fim > limite_operacional:
            raise ValidationError(f"O serviço ultrapassa o limite operacional das 18:00 (Término previsto: {fim.strftime('%H:%M')}).")

        conflitos = OrdemServico.objects.filter(
            data_hora__date=data_hora.date(),
            status__in=['PATIO', 'VISTORIA_INICIAL', 'EM_EXECUCAO', 'LIBERACAO', 'BLOQUEADO_INCIDENTE']
        ).select_related('servico')

        for os in conflitos:
            os_inicio = timezone.localtime(os.data_hora)
            os_fim = os_inicio + datetime.timedelta(minutes=os.servico.duracao_estimada_minutos)
            if data_hora < os_fim and os_inicio < fim:
                raise ValidationError(f'Conflito com OS das {os_inicio.strftime("%H:%M")} às {os_fim.strftime("%H:%M")}.')

    @staticmethod
    @transaction.atomic
    def criar_com_veiculo(dados, funcionario):
        """Cria OS garantindo apenas uma ativa por vez e validando disponibilidade."""
        servico = get_object_or_404(Servico, pk=dados['servico_id'])
        
        # Lock pessimista no estabelecimento para evitar race condition na reserva de horários
        # (Axioma 14 / PR-Review RF-22)
        Estabelecimento.objects.select_for_update().get(id=servico.estabelecimento_id)
        
        OrdemServicoService.verificar_conflito(dados['data_hora'], datetime.timedelta(minutes=servico.duracao_estimada_minutos))

        veiculo, _ = Veiculo.objects.update_or_create(
            placa=dados['placa'],
            defaults={
                'modelo': dados['modelo'],
                'marca': dados.get('marca', 'Não informada'),
                'cor': dados.get('cor', 'Não informada'),
                'nome_dono': dados.get('nome_dono', ''),
                'celular_dono': dados.get('celular_dono', ''),
                'estabelecimento': servico.estabelecimento
            }
        )

        iniciar_agora = dados.get('iniciar_agora', False)
        if iniciar_agora:
            if OrdemServico.objects.filter(funcionario=funcionario, status='EM_EXECUCAO').exists():
                raise ValidationError('O funcionário já possui uma OS em execução.')

        return OrdemServico.objects.create(
            veiculo=veiculo, servico=servico, funcionario=funcionario,
            estabelecimento=servico.estabelecimento,
            data_hora=dados['data_hora'],
            status='VISTORIA_INICIAL' if iniciar_agora else 'PATIO',
            observacoes=dados.get('observacoes', ''),
        )

    @staticmethod
    def avancar_etapa(os_id: int, dados: dict) -> OrdemServico:
        """Máquina de Estados Industrial: Gere transições e horários."""
        os = get_object_or_404(OrdemServico, id=os_id)
        status_atual = os.status
        agora = timezone.now()

        # ETAPA 1: PATIO → VISTORIA_INICIAL (valida 5 fotos de vistoria)
        if status_atual == 'PATIO':
            contagem_fotos = MidiaOrdemServico.objects.filter(
                ordem_servico=os,
                momento='VISTORIA_GERAL'
            ).count()

            if contagem_fotos < 5:
                raise ValueError(f"Ação negada: mínimo de 5 fotos de vistoria exigidas. (Atual: {contagem_fotos})")

            os.status = 'VISTORIA_INICIAL'
            os.laudo_vistoria = dados.get('laudo_vistoria', '')
            os.save()

        # ETAPA 2: VISTORIA_INICIAL → EM_EXECUCAO (operador inicia lavagem)
        elif status_atual == 'VISTORIA_INICIAL':
            os.status = 'EM_EXECUCAO'
            os.horario_lavagem = agora
            os.comentario_lavagem = dados.get('comentario_lavagem', '')
            os.save()

        # ETAPA 3: EM_EXECUCAO sub-fase lavagem → acabamento (status permanece EM_EXECUCAO)
        elif status_atual == 'EM_EXECUCAO' and not os.horario_acabamento:
            os.horario_acabamento = agora
            os.save()

        # ETAPA 4: EM_EXECUCAO (acabamento concluído) → LIBERACAO
        elif status_atual == 'EM_EXECUCAO' and os.horario_acabamento:
            os.comentario_acabamento = dados.get('comentario_acabamento', '')
            os.status = 'LIBERACAO'
            os.save()

        return os

    @staticmethod
    def finalizar_ordem_servico_industrial(os_id: int, dados: dict) -> OrdemServico:
        """Etapa 4: Finalização com validação de fotos de entrega e vaga."""
        os = get_object_or_404(OrdemServico, id=os_id)

        # RN-01: Trava de segurança - impedir finalização com incidentes não resolvidos
        incidentes_abertos = os.incidentes.filter(resolvido=False).exists()
        if incidentes_abertos:
            raise ValueError("Não é possível finalizar a OS enquanto houver incidentes em aberto.")

        if MidiaOrdemServico.objects.filter(ordem_servico=os, momento='FINALIZADO').count() < 5:
            raise ValueError("5 fotos de entrega exigidas.")

        if not dados.get('vaga_patio'):
            raise ValueError("A vaga de saída é obrigatória.")

        os.status = 'FINALIZADO'
        os.vaga_patio = dados.get('vaga_patio')
        os.horario_finalizacao = timezone.now()
        os.save()

        return os
    


    @staticmethod
    @transaction.atomic
    def finalizar_checkout_publico(dados):
        """RF-23: Cria agendamento B2C garantindo integridade e atomicidade."""
        estabelecimento = Estabelecimento.objects.filter(slug=dados['slug'], is_active=True).first()
        if not estabelecimento:
            raise ValidationError("Estabelecimento não encontrado")
        
        servico = Servico.objects.filter(id=dados['servico_id'], estabelecimento=estabelecimento).first()
        if not servico:
            raise ValidationError("Serviço não encontrado")

        # LOCK PESSIMISTA (Sugerido no Report RF-22) para evitar Race Condition
        Estabelecimento.objects.select_for_update().get(id=estabelecimento.id)

        # Validação de disponibilidade (RF-22)
        OrdemServicoService.verificar_conflito(
            dados['data_hora'], 
            datetime.timedelta(minutes=servico.duracao_estimada_minutos)
        )

        # Cria ou atualiza o veículo (Cadastro Dinâmico)
        veiculo, _ = Veiculo.objects.update_or_create(
            placa=dados['placa'],
            defaults={
                'modelo': dados['modelo'],
                'cor': dados['cor'],
                'nome_dono': dados['nome_cliente'],
                'celular_dono': dados['whatsapp'],
                'estabelecimento': estabelecimento
            }
        )

        # Cria a Ordem de Serviço inicial no Pátio
        return OrdemServico.objects.create(
            estabelecimento=estabelecimento,
            veiculo=veiculo,
            servico=servico,
            data_hora=dados['data_hora'],
            status='PATIO'
        )


class HistoricoGestorService:
    """RF-17/RF-18: Histórico e galeria de OS para o Gestor."""

    @staticmethod
    def listar_historico_gestor(
        estabelecimento, data_inicio=None, data_fim=None,
        placa=None, status=None, com_incidente_resolvido=False,
    ):
        """RF-17: Lista OS encerradas do estabelecimento com filtros opcionais."""
        hoje = timezone.localdate()

        if data_inicio and data_fim:
            if data_inicio > data_fim:
                raise ValidationError("A data inicial não pode ser maior que a data final.")
            if data_fim > hoje:
                raise ValidationError("A data final não pode ser uma data futura.")

        filtros = {'estabelecimento': estabelecimento}

        if data_inicio:
            filtros['data_hora__date__gte'] = data_inicio
        if data_fim:
            filtros['data_hora__date__lte'] = data_fim
        if placa:
            filtros['veiculo__placa__icontains'] = placa.strip().upper()

        # RN: histórico exibe apenas estados terminais; filtro explícito sobrescreve
        if status:
            filtros['status'] = status
        else:
            filtros['status__in'] = ['FINALIZADO', 'CANCELADO']

        queryset = (
            OrdemServico.objects
            .filter(**filtros)
            .select_related('veiculo', 'servico', 'funcionario')
            .order_by('-data_hora')
        )

        if com_incidente_resolvido:
            queryset = queryset.filter(incidentes__resolvido=True).distinct()

        return queryset

    @staticmethod
    def montar_galeria_os(os_id, estabelecimento):
        """RF-18: Retorna mídias da OS agrupadas por momento para auditoria visual."""
        os = get_object_or_404(OrdemServico, id=os_id)

        if os.estabelecimento_id != estabelecimento.id:
            from django.core.exceptions import PermissionDenied
            raise PermissionDenied("Esta OS não pertence ao seu estabelecimento.")

        midias = MidiaOrdemServico.objects.filter(ordem_servico=os).order_by('id')

        return {
            'estado_inicial': [m for m in midias if m.momento in ('VISTORIA_GERAL', 'AVARIA_PREVIA')],
            'estado_meio':    [m for m in midias if m.momento == 'EXECUCAO'],
            'estado_final':   [m for m in midias if m.momento == 'FINALIZADO'],
        }


class KanbanService:
    """RF-14: Agrupa OS operacionais por status para o quadro Kanban."""

    COLUNAS = ['PATIO', 'LAVAGEM', 'FINALIZADO_HOJE', 'INCIDENTES']
    STATUS_LAVAGEM = ['VISTORIA_INICIAL', 'EM_EXECUCAO', 'LIBERACAO']

    @staticmethod
    def listar_por_estabelecimento(estabelecimento):
        from django.db.models import Q
        hoje = timezone.localdate()
        # OS ativas (qualquer data) + finalizadas somente hoje
        return (
            OrdemServico.objects
            .filter(estabelecimento=estabelecimento)
            .filter(
                Q(status__in=['PATIO', 'VISTORIA_INICIAL', 'EM_EXECUCAO', 'LIBERACAO', 'BLOQUEADO_INCIDENTE']) |
                Q(status='FINALIZADO', horario_finalizacao__date=hoje)
            )
            .select_related('veiculo', 'servico')
            .prefetch_related('incidentes')
            .order_by('data_hora')
        )


class IncidenteService:
    """Serviço para isolar o fluxo de erros e incidentes operacionais."""

    class IncidenteJaResolvidoError(Exception):
        """Conflito de domínio para resolução duplicada."""

    @staticmethod
    def listar_pendentes(estabelecimento):
        """RF-15: lista incidentes abertos de OS bloqueadas do estabelecimento."""
        return (
            IncidenteOS.objects
            .filter(
                ordem_servico__estabelecimento=estabelecimento,
                ordem_servico__status='BLOQUEADO_INCIDENTE',
                resolvido=False,
            )
            .select_related('ordem_servico__veiculo', 'ordem_servico__servico', 'tag_peca')
            .order_by('-data_registro')
        )

    @staticmethod
    def detalhar_auditoria(incidente_id, estabelecimento):
        incidente = get_object_or_404(
            IncidenteOS.objects.select_related(
                'ordem_servico__veiculo',
                'ordem_servico__servico',
                'ordem_servico__funcionario',
                'tag_peca',
            ),
            id=incidente_id,
        )

        if incidente.ordem_servico.estabelecimento_id != estabelecimento.id:
            raise PermissionDenied("Este incidente não pertence ao seu estabelecimento.")

        incidente.vistoria_item_auditavel = (
            VistoriaItem.objects
            .filter(ordem_servico=incidente.ordem_servico, tag_peca=incidente.tag_peca)
            .first()
        )
        return incidente

    @staticmethod
    def resolver_incidente(incidente_id, estabelecimento, gestor_user, observacoes_resolucao):
        nota = (observacoes_resolucao or '').strip()
        if not nota:
            raise ValidationError("A nota de resolução é obrigatória.")

        with transaction.atomic():
            incidente = get_object_or_404(
                IncidenteOS.objects.select_related('ordem_servico').select_for_update(),
                id=incidente_id,
            )

            if incidente.ordem_servico.estabelecimento_id != estabelecimento.id:
                raise PermissionDenied("Este incidente não pertence ao seu estabelecimento.")

            if incidente.resolvido:
                raise IncidenteService.IncidenteJaResolvidoError(
                    "O incidente informado já foi resolvido."
                )

            incidente.resolvido = True
            incidente.observacoes_resolucao = nota
            incidente.gestor_resolucao = gestor_user
            incidente.data_resolucao = timezone.now()
            incidente.save(
                update_fields=[
                    'resolvido',
                    'observacoes_resolucao',
                    'gestor_resolucao',
                    'data_resolucao',
                ]
            )

            ordem_servico = incidente.ordem_servico
            ordem_servico.status = incidente.status_anterior_os
            ordem_servico.save(update_fields=['status'])

        incidente.refresh_from_db()
        return incidente

    @staticmethod
    def registrar_incidente(os_id, dados, arquivo_foto):
        """Registra o incidente, vincula a peça afetada e bloqueia a OS."""
        os = get_object_or_404(OrdemServico, id=os_id)
        tag_peca = get_object_or_404(TagPeca, id=dados.get('tag_peca_id'))
        status_anterior_os = os.status

        foto_processada = MidiaOrdemServicoService._comprimir_imagem(arquivo_foto)

        with transaction.atomic():
            incidente = IncidenteOS.objects.create(
                ordem_servico=os,
                tag_peca=tag_peca,
                descricao=dados.get('descricao'),
                foto_url=foto_processada,
                status_anterior_os=status_anterior_os,
                resolvido=False,
            )

            os.status = 'BLOQUEADO_INCIDENTE'
            os.save(update_fields=['status'])

        return incidente
