import datetime
from django.test import TestCase
from django.utils import timezone
from django.core.exceptions import ValidationError
from accounts.models import Estabelecimento
from core.models import Servico
from operacao.services import OrdemServicoService
from agendamento_publico.services import DisponibilidadeService

class RetroativoTestCase(TestCase):
    def setUp(self):
        self.estabelecimento = Estabelecimento.objects.create(
            nome_fantasia="Lava-Me Retro",
            slug="lava-me-retro",
            horario_abertura=datetime.time(8, 0),
            horario_fechamento=datetime.time(18, 0)
        )
        self.servico = Servico.objects.create(
            nome="Ducha Simples",
            preco=30,
            duracao_estimada_minutos=30,
            estabelecimento=self.estabelecimento
        )

    def test_disponibilidade_nao_deve_retornar_horarios_para_datas_passadas(self):
        ontem = timezone.localdate() - datetime.timedelta(days=1)
        horarios = DisponibilidadeService.calcular_horarios_livres(
            self.estabelecimento, self.servico, ontem
        )
        self.assertEqual(len(horarios), 0, "Deveria retornar lista vazia para datas passadas.")

    def test_criar_os_em_data_retroativa_deve_falhar(self):
        agora = timezone.now()
        passado = agora - datetime.timedelta(hours=2)
        
        # Simulando dados de criação
        dados = {
            'servico_id': self.servico.id,
            'data_hora': passado,
            'placa': 'RET-1234',
            'modelo': 'Fusca',
            'cor': 'Azul'
        }
        
        with self.assertRaises(ValidationError) as cm:
            OrdemServicoService.criar_com_veiculo(dados, None)
        
        self.assertIn("Não é possível agendar para uma data ou horário retroativo.", str(cm.exception))
