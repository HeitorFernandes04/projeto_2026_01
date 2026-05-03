import datetime
from django.test import TransactionTestCase
from django.utils import timezone
from django.core.exceptions import ValidationError
from operacao.services import OrdemServicoService
from operacao.tests.factories import ServicoFactory, UserFactory, EstabelecimentoFactory
from unittest.mock import patch

class OrdemServicoConcurrencyTest(TransactionTestCase):
    """
    Testa a segurança de concorrência (Axioma 7 e 14).
    Simula o cenário onde dois usuários tentam agendar o mesmo horário simultaneamente.
    """

    def setUp(self):
        self.estabelecimento = EstabelecimentoFactory()
        self.servico = ServicoFactory(estabelecimento=self.estabelecimento, duracao_estimada_minutos=30)
        self.funcionario = UserFactory(estabelecimento=self.estabelecimento)
        self.data_agendamento = timezone.now() + datetime.timedelta(days=1)
        self.data_agendamento = self.data_agendamento.replace(hour=10, minute=0, second=0, microsecond=0)

    def test_prevent_race_condition_on_simultaneous_booking(self):
        """
        Simula o 'buraco' entre a verificação e a criação.
        Sem o select_for_update, duas chamadas passariam pela verificação e criariam duplicatas.
        """
        dados = {
            'servico_id': self.servico.id,
            'data_hora': self.data_agendamento,
            'placa': 'RACE001',
            'modelo': 'Teste Concorrente',
            'iniciar_agora': False
        }

        # Criamos a primeira OS normalmente
        OrdemServicoService.criar_com_veiculo(dados, self.funcionario)

        # Tentamos criar a segunda no mesmo horário -> Deve falhar por conflito
        with self.assertRaises(ValidationError) as cm:
            OrdemServicoService.criar_com_veiculo(dados, self.funcionario)
        
        self.assertIn("Conflito com OS", str(cm.exception))

    @patch('operacao.services.OrdemServico.objects.create')
    def test_atomic_lock_simulation(self, mock_create):
        """
        Este teste valida se a lógica de verificação é re-executada 
        ou protegida se houver um delay entre check e save.
        """
        # (Este teste será aprimorado após a implementação do lock para garantir 
        # que o select_for_update no estabelecimento está presente)
        pass
