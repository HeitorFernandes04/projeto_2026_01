from datetime import timedelta
from django.utils import timezone
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from atendimentos.tests.factories import AtendimentoFactory, UserFactory, MidiaAtendimentoFactory, ServicoFactory

class TestAtendimentoFluxoAPI(APITestCase):
    def setUp(self):
        self.funcionario = UserFactory()
        self.servico = ServicoFactory()
        self.client = APIClient()
        self.client.force_authenticate(user=self.funcionario)

    def test_criar_atendimento_avulso_com_sucesso(self):
        """Valida a criação de um atendimento 'na hora' (AVULSO)."""
        url = reverse('atendimento-criar')
        dados = {
            'placa': 'WWW1234', 'modelo': 'Polo', 'marca': 'VW',
            'cor': 'Branco', 'nome_dono': 'Marcos Paulo',
            'servico_id': self.servico.id, 'data_hora': timezone.now().isoformat(),
            'origem': 'AVULSO', 'iniciar_agora': True
        }
        response = self.client.post(url, dados)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_bloqueio_agendamento_duplicado_hoje(self):
        """RN: Impede dois carros em andamento para o mesmo funcionário hoje."""
        AtendimentoFactory(funcionario=self.funcionario, status='em_andamento')
        
        url = reverse('atendimento-criar')
        dados = {
            'placa': 'BBB2222', 'modelo': 'Civic', 'marca': 'Honda',
            'nome_dono': 'Carlos', 'servico_id': self.servico.id, 
            'data_hora': (timezone.now() + timedelta(hours=3)).isoformat(), # Evita conflito de pátio
            'origem': 'AVULSO', 'iniciar_agora': True
        }
        response = self.client.post(url, dados)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('O funcionário já possui um atendimento em andamento.', str(response.data))

    def test_bloqueio_conflito_de_horario(self):
        """RN: Impede agendamento se o box já estiver ocupado."""
        horario = timezone.now() + timedelta(days=1)
        AtendimentoFactory(data_hora=horario, status='agendado', servico=self.servico)

        url = reverse('atendimento-criar')
        dados = {
            'placa': 'ZZZ9999', 'modelo': 'Fit', 'marca': 'Honda',
            'nome_dono': 'João Neves', 'servico_id': self.servico.id,
            'data_hora': horario.isoformat(), 'origem': 'AGENDADO'
        }
        response = self.client.post(url, dados)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Conflito com atendimento', str(response.data))

    def test_avancar_etapa_vistoria_sucesso(self):
        """Valida avanço após registrar 5 fotos obrigatórias."""
        atendimento = AtendimentoFactory(funcionario=self.funcionario, status='em_andamento')
        for _ in range(5):
            MidiaAtendimentoFactory(atendimento=atendimento, momento='VISTORIA_GERAL')
        
        url = reverse('atendimento-avancar', kwargs={'pk': atendimento.pk})
        response = self.client.patch(url, data={'laudo_vistoria': 'OK'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

class TestHistoricoAPI(APITestCase):
    def setUp(self):
        self.funcionario = UserFactory()
        self.client = APIClient()
        self.client.force_authenticate(user=self.funcionario)
        self.url = reverse('atendimentos-historico')

    def test_historico_erro_data_inicial_maior_que_final(self):
        """Valida bloqueio de datas invertidas."""
        response = self.client.get(self.url, {'data_inicial': '2026-12-31', 'data_final': '2026-01-01'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)