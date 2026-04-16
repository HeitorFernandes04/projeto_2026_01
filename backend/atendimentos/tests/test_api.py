from datetime import timedelta
from django.utils import timezone
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from atendimentos.tests.factories import OrdemServicoFactory, UserFactory, MidiaOrdemServicoFactory, ServicoFactory

class TestOrdemServicoFluxoAPI(APITestCase):
    def setUp(self):
        self.funcionario = UserFactory()
        self.servico = ServicoFactory()
        self.client = APIClient()
        self.client.force_authenticate(user=self.funcionario)

    def test_criar_ordem_servico_avulso_com_sucesso(self):
        """Valida a criação de um ordem_servico 'na hora' (AVULSO)."""
        url = reverse('os-criar')
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
        OrdemServicoFactory(funcionario=self.funcionario, status='EM_EXECUCAO')
        
        url = reverse('os-criar')
        dados = {
            'placa': 'BBB2222', 'modelo': 'Civic', 'marca': 'Honda',
            'nome_dono': 'Carlos', 'servico_id': self.servico.id, 
            'data_hora': (timezone.now() + timedelta(hours=3)).isoformat(), # Evita conflito de pátio
            'origem': 'AVULSO', 'iniciar_agora': True
        }
        response = self.client.post(url, dados)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('já possui uma OS em execução', str(response.data))

    def test_bloqueio_conflito_de_horario(self):
        """RN: Impede agendamento se o box já estiver ocupado."""
        horario = timezone.now() + timedelta(days=1)
        OrdemServicoFactory(data_hora=horario, status='PATIO', servico=self.servico)

        url = reverse('os-criar')
        dados = {
            'placa': 'ZZZ9999', 'modelo': 'Fit', 'marca': 'Honda',
            'nome_dono': 'João Neves', 'servico_id': self.servico.id,
            'data_hora': horario.isoformat(), 'origem': 'AGENDADO'
        }
        response = self.client.post(url, dados)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Conflito com OS', str(response.data))

    def test_avancar_etapa_vistoria_sucesso(self):
        """Valida avanço após registrar 5 fotos obrigatórias."""
        ordem_servico = OrdemServicoFactory(funcionario=self.funcionario, status='VISTORIA_INICIAL')
        for _ in range(5):
            MidiaOrdemServicoFactory(ordem_servico=ordem_servico, momento='VISTORIA_GERAL')
        
        url = reverse('os-avancar', kwargs={'pk': ordem_servico.pk})
        response = self.client.patch(url, data={'laudo_vistoria': 'OK'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_finalizar_os_sucesso(self):
        """Valida finalização com 5 fotos de FINALIZADO e vaga."""
        os = OrdemServicoFactory(funcionario=self.funcionario, status='LIBERACAO')
        for _ in range(5):
            MidiaOrdemServicoFactory(ordem_servico=os, momento='FINALIZADO')
        
        url = reverse('os-finalizar', kwargs={'pk': os.pk})
        dados = {'vaga_patio': 'VAGA_A1'}
        response = self.client.patch(url, dados)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'FINALIZADO')

    def test_finalizar_os_bloqueio_fotos(self):
        """RN: Bloqueia finalização se faltar fotos de entrega."""
        os = OrdemServicoFactory(funcionario=self.funcionario, status='LIBERACAO')
        # Apenas 3 fotos
        for _ in range(3):
            MidiaOrdemServicoFactory(ordem_servico=os, momento='FINALIZADO')
            
        url = reverse('os-finalizar', kwargs={'pk': os.pk})
        response = self.client.patch(url, {'vaga_patio': 'V1'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('5 fotos de entrega exigidas', str(response.data))

class TestHistoricoAPI(APITestCase):
    def setUp(self):
        self.funcionario = UserFactory()
        self.client = APIClient()
        self.client.force_authenticate(user=self.funcionario)
        self.url = reverse('os-historico')

    def test_historico_erro_data_inicial_maior_que_final(self):
        """Valida bloqueio de datas invertidas."""
        response = self.client.get(self.url, {'data_inicial': '2026-12-31', 'data_final': '2026-01-01'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)