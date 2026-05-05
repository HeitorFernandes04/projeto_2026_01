import datetime
import re
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import Cliente, User
from core.models import Veiculo
from operacao.models import OrdemServico
from core.models import Servico
from accounts.models import Estabelecimento


B2C_USERNAME_PREFIX = 'b2c_'
B2C_EMAIL_DOMAIN = 'cliente.lava.me'


class AuthB2CService:
    @staticmethod
    def normalizar_telefone(telefone):
        return re.sub(r'\D', '', telefone or '')

    @staticmethod
    def normalizar_placa(placa):
        return re.sub(r'[^A-Z0-9]', '', (placa or '').strip().upper())

    @staticmethod
    def montar_username(telefone):
        return f'{B2C_USERNAME_PREFIX}{AuthB2CService.normalizar_telefone(telefone)}'

    @staticmethod
    def montar_email_fantasma(telefone):
        return f'{AuthB2CService.normalizar_telefone(telefone)}@{B2C_EMAIL_DOMAIN}'

    @staticmethod
    def _emitir_tokens(user):
        refresh = RefreshToken.for_user(user)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }

    @staticmethod
    def _buscar_veiculo_por_titularidade(telefone, placa):
        telefone_normalizado = AuthB2CService.normalizar_telefone(telefone)
        placa_normalizada = AuthB2CService.normalizar_placa(placa)

        veiculos = Veiculo.objects.filter(
            placa=placa_normalizada,
        ).select_related('estabelecimento')

        for veiculo in veiculos:
            if AuthB2CService.normalizar_telefone(veiculo.celular_dono) == telefone_normalizado:
                return veiculo

        raise PermissionDenied('Combinacao de placa e telefone nao encontrada.')

    @staticmethod
    @transaction.atomic
    def setup_cliente(telefone, placa, pin):
        telefone_normalizado = AuthB2CService.normalizar_telefone(telefone)
        if len(telefone_normalizado) < 10:
            raise ValidationError('Telefone invalido.')

        username = AuthB2CService.montar_username(telefone_normalizado)
        if User.objects.filter(username=username).exists():
            raise ValidationError('Este usuario ja possui PIN cadastrado.')

        veiculo = AuthB2CService._buscar_veiculo_por_titularidade(
            telefone=telefone_normalizado,
            placa=placa,
        )

        nome_cliente = (veiculo.nome_dono or 'Cliente Lava-Me').strip()
        user = User(
            email=AuthB2CService.montar_email_fantasma(telefone_normalizado),
            username=username,
            name=nome_cliente,
            is_staff=False,
            is_superuser=False,
        )
        user.set_password(pin)
        user.save()

        Cliente.objects.create(
            user=user,
            telefone_whatsapp=telefone_normalizado,
        )

        return AuthB2CService._emitir_tokens(user)

    @staticmethod
    def login_cliente(telefone, pin):
        telefone_normalizado = AuthB2CService.normalizar_telefone(telefone)
        username = AuthB2CService.montar_username(telefone_normalizado)
        user = (
            User.objects
            .filter(username=username, is_active=True)
            .select_related('perfil_cliente')
            .first()
        )

        if not user or not hasattr(user, 'perfil_cliente') or not user.check_password(pin):
            raise PermissionDenied('Telefone ou PIN incorretos.')

        return AuthB2CService._emitir_tokens(user)

    @staticmethod
    def montar_painel_cliente(user):
        if not hasattr(user, 'perfil_cliente'):
            raise PermissionDenied('Usuario sem perfil de cliente.')

        telefone = AuthB2CService.normalizar_telefone(user.perfil_cliente.telefone_whatsapp)
        ordens = (
            OrdemServico.objects
            .filter(veiculo__celular_dono=telefone)
            .select_related('veiculo', 'servico', 'estabelecimento')
            .order_by('-data_hora')
        )

        ativos = []
        historico = []
        for ordem in ordens:
            item = {
                'id': ordem.id,
                'placa': ordem.veiculo.placa,
                'modelo': ordem.veiculo.modelo,
                'servico': ordem.servico.nome,
                'unidade': ordem.estabelecimento.nome_fantasia,
                'status': ordem.status,
                'data_hora': ordem.data_hora,
            }
            if ordem.status in ('FINALIZADO', 'CANCELADO'):
                historico.append(item)
            else:
                ativos.append(item)

        return {
            'cliente_nome': user.name or 'Cliente',
            'ativos': ativos,
            'historico': historico,
        }

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
