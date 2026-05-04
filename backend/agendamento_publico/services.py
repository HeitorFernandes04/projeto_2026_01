import datetime
import logging
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from operacao.models import OrdemServico
from core.models import Servico
from accounts.models import Estabelecimento

logger = logging.getLogger('agendamento_publico')

class DisponibilidadeService:
    @staticmethod
    def calcular_horarios_livres(estabelecimento: Estabelecimento, servico: Servico, data_alvo: datetime.date):
        # 1. Trava retroativa (RF-22)
        if data_alvo < timezone.localdate():
            return []

        # 2. Definir limites operacionais (RF-22)
        # Trava rígida de 18:00 conforme REQUISITOS_RF22_HORARIOS.pdf
        limite_operacional = datetime.time(18, 0)
        hora_fechamento = min(estabelecimento.horario_fechamento, limite_operacional)
        
        abertura = timezone.make_aware(datetime.datetime.combine(data_alvo, estabelecimento.horario_abertura))
        fechamento = timezone.make_aware(datetime.datetime.combine(data_alvo, hora_fechamento))

        # 2. Buscar Ordens de Serviço ocupadas
        # Axioma 13: Status que ocupam vaga
        os_ocupadas = OrdemServico.objects.filter(
            estabelecimento=estabelecimento,
            data_hora__date=data_alvo,
            status__in=['PATIO', 'VISTORIA_INICIAL', 'EM_EXECUCAO', 'LIBERACAO', 'BLOQUEADO_INCIDENTE']
        ).select_related('servico')

        # 3. Gerar slots DINÂMICOS
        slots_disponiveis = []
        duracao_minutos = max(servico.duracao_estimada_minutos, 15)
        passo = datetime.timedelta(minutes=duracao_minutos)
        
        cursor = abertura
        agora = timezone.now()

        while cursor + datetime.timedelta(minutes=duracao_minutos) <= fechamento:
            fim_proposto = cursor + datetime.timedelta(minutes=duracao_minutos)
            
            # Filtro retroativo (Hoje)
            if data_alvo == timezone.localdate() and cursor <= agora:
                cursor += passo
                continue
            
            conflito = False
            for os in os_ocupadas:
                os_inicio = os.data_hora
                os_fim = os_inicio + datetime.timedelta(minutes=os.servico.duracao_estimada_minutos)
                
                # Intersecção de intervalos
                if cursor < os_fim and fim_proposto > os_inicio:
                    conflito = True
                    break
            
            if not conflito:
                slots_disponiveis.append({
                    "inicio": timezone.localtime(cursor).strftime("%H:%M"),
                    "fim": timezone.localtime(fim_proposto).strftime("%H:%M")
                })
            
            cursor += passo
            
        return slots_disponiveis


class CancelamentoService:
    """RF-24: Cancelamento autônomo de agendamento pelo cliente via slug UUID."""

    ANTECEDENCIA_MINIMA_HORAS = 1

    @staticmethod
    @transaction.atomic
    def cancelar_por_slug(slug: str, motivo: str = '') -> OrdemServico:
        """
        RF-24.1: Apenas status PATIO pode ser cancelado.
        RF-24.2: Antecedência mínima de 1 hora.
        RF-24.3: Busca via slug (UUID), nunca via ID sequencial.
        RF-24.4: Liberação automática — OS CANCELADA sai do filtro de conflitos.
        RF-24.5: Log para o gestor.
        RNF-01: select_for_update — atomicidade.
        RNF-02: Registra cancelado_em, motivo_cancelamento e cancelado_por.
        """
        # RF-24.3: Busca via slug
        try:
            os = (
                OrdemServico.objects
                .select_for_update()  # RNF-01: lock pessimista
                .select_related('servico', 'estabelecimento')
                .get(slug_cancelamento=slug)
            )
        except OrdemServico.DoesNotExist:
            raise ValidationError("Agendamento não encontrado.")

        # RF-24.1: Apenas status PATIO
        if os.status != 'PATIO':
            raise PermissionError(
                "Não é possível cancelar um serviço que já foi iniciado."
            )

        # RF-24.2: Antecedência mínima de 1 hora
        agora = timezone.now()
        antecedencia = os.data_hora - agora
        if antecedencia.total_seconds() < CancelamentoService.ANTECEDENCIA_MINIMA_HORAS * 3600:
            raise ValidationError(
                "O cancelamento só é permitido com 1 hora de antecedência."
            )

        # Transição de status + campos de auditoria (RNF-02)
        os.status               = 'CANCELADO'
        os.cancelado_em         = agora
        os.motivo_cancelamento  = motivo.strip() if motivo else ''
        os.cancelado_por        = 'CLIENTE_PORTAL'
        os.save(update_fields=[
            'status', 'cancelado_em', 'motivo_cancelamento', 'cancelado_por'
        ])

        # RF-24.4: O horário é liberado automaticamente — OS CANCELADA não aparece
        # no filtro status__in=[PATIO, VISTORIA_INICIAL, ...] do DisponibilidadeService.

        # RF-24.5: Log interno para auditoria do gestor
        logger.info(
            "RF-24 | OS #%s cancelada via CLIENTE_PORTAL | "
            "Estabelecimento: %s | Data agendada: %s",
            os.id,
            os.estabelecimento.nome_fantasia,
            os.data_hora.isoformat(),
        )

        return os
