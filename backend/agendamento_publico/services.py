import datetime
from django.utils import timezone
from operacao.models import OrdemServico
from core.models import Servico
from accounts.models import Estabelecimento

class DisponibilidadeService:
    @staticmethod
    def calcular_horarios_livres(estabelecimento: Estabelecimento, servico: Servico, data_alvo: datetime.date):
        # 1. Definir limites operacionais (RF-22)
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
