import pytest
import datetime
from django.utils import timezone
from core.models import Servico, Veiculo
from operacao.models import OrdemServico
from accounts.models import Estabelecimento, User
from agendamento_publico.services import DisponibilidadeService

@pytest.mark.django_db
class TestMotorDisponibilidade:

    @pytest.fixture
    def setup_dados(self):
        user = User.objects.create(email="gestor@teste.com", username="gestor")
        est = Estabelecimento.objects.create(
            nome_fantasia="Lava-Me Centro",
            cnpj="12345678901234",
            horario_abertura=datetime.time(8, 0),
            horario_fechamento=datetime.time(18, 0)
        )
        serv_curto = Servico.objects.create(
            nome="Lavagem Simples",
            preco=50.00,
            duracao_estimada_minutos=30,
            estabelecimento=est
        )
        serv_longo = Servico.objects.create(
            nome="Polimento",
            preco=200.00,
            duracao_estimada_minutos=120,
            estabelecimento=est
        )
        return est, serv_curto, serv_longo, user

    def test_dia_vazio_retorna_todos_slots(self, setup_dados):
        est, serv, _, _ = setup_dados
        data_futura = timezone.localdate() + datetime.timedelta(days=2)
        
        horarios = DisponibilidadeService.calcular_horarios_livres(est, serv, data_futura)
        
        # 8:00 até 18:00 com 30 min de duração e 30 min de passo
        # 08:00, 08:30 ... 17:30 (17:30 + 30m = 18:00 OK)
        # Total: 10 horas * 2 slots/hora = 20 slots
        assert len(horarios) == 20
        assert horarios[0]['inicio'] == "08:00"
        assert horarios[-1]['inicio'] == "17:30"

    def test_servico_longo_tem_menos_slots(self, setup_dados):
        est, _, serv_longo, _ = setup_dados
        data_futura = timezone.localdate() + datetime.timedelta(days=2)
        
        horarios = DisponibilidadeService.calcular_horarios_livres(est, serv_longo, data_futura)
        
        # 120 min de duração. Passo agora é dinâmico (120 min).
        # Slots possíveis: 08:00, 10:00, 12:00, 14:00, 16:00 (16:00 + 2h = 18:00)
        # Total: 5 slots
        assert len(horarios) == 5
        assert horarios[0]['inicio'] == "08:00"
        assert horarios[-1]['inicio'] == "16:00"

    def test_bloqueio_por_os_existente(self, setup_dados):
        est, serv, _, user = setup_dados
        data_futura = timezone.localdate() + datetime.timedelta(days=2)
        
        # Criar uma OS das 09:00 às 09:30
        veiculo = Veiculo.objects.create(placa="ABC1234", estabelecimento=est)
        OrdemServico.objects.create(
            estabelecimento=est,
            veiculo=veiculo,
            servico=serv,
            funcionario=user,
            data_hora=timezone.make_aware(datetime.datetime.combine(data_futura, datetime.time(9, 0))),
            status='PATIO'
        )
        
        horarios = DisponibilidadeService.calcular_horarios_livres(est, serv, data_futura)
        
        # O slot das 09:00 deve sumir
        inicios = [h['inicio'] for h in horarios]
        assert "09:00" not in inicios
        assert "08:30" in inicios
        assert "09:30" in inicios
        assert len(horarios) == 19

    def test_bloqueio_por_os_longa_afeta_multiplos_slots(self, setup_dados):
        est, serv_curto, serv_longo, user = setup_dados
        data_futura = timezone.localdate() + datetime.timedelta(days=2)
        
        # Criar uma OS LONGA das 10:00 às 12:00
        veiculo = Veiculo.objects.create(placa="XYZ9999", estabelecimento=est)
        OrdemServico.objects.create(
            estabelecimento=est,
            veiculo=veiculo,
            servico=serv_longo,
            funcionario=user,
            data_hora=timezone.make_aware(datetime.datetime.combine(data_futura, datetime.time(10, 0))),
            status='EM_EXECUCAO'
        )
        
        # Consultar disponibilidade para serviço CURTO (30 min)
        horarios = DisponibilidadeService.calcular_horarios_livres(est, serv_curto, data_futura)
        
        # Slots entre 10:00 e 12:00 não podem estar livres
        # 10:00, 10:30, 11:00, 11:30 (4 slots de 30 min)
        inicios = [h['inicio'] for h in horarios]
        assert "10:00" not in inicios
        assert "10:30" not in inicios
        assert "11:00" not in inicios
        assert "11:30" not in inicios
        assert "09:30" in inicios
        assert "12:00" in inicios
        assert len(horarios) == 16 # 20 - 4
