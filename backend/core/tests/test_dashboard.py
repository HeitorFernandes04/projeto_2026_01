from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from datetime import timedelta
from accounts.models import Gestor
from operacao.tests.factories import EstabelecimentoFactory, UserFactory, ServicoFactory, OrdemServicoFactory

class TestDashboardEEficiencia(APITestCase):
    def setUp(self):
        self.estabelecimento = EstabelecimentoFactory()
        self.user_gestor = UserFactory(username='gestor_dash', email='gestor_dash@teste.com')
        Gestor.objects.create(user=self.user_gestor, estabelecimento=self.estabelecimento)
        
        self.servico_1 = ServicoFactory(estabelecimento=self.estabelecimento, preco=50.00, duracao_estimada_minutos=30)
        self.servico_2 = ServicoFactory(estabelecimento=self.estabelecimento, preco=120.00, duracao_estimada_minutos=60)
        
        self.url_indicadores = '/api/gestao/gestor/dashboard/indicadores/'
        
    def test_dashboard_indicadores_rf19_sucesso(self):
        """Teste 1: Consultar indicadores do dia como Gestor com OS finalizadas."""
        hoje = timezone.localtime().date()
        
        # Criação de OS Finalizadas no mesmo estabelecimento hoje
        os1 = OrdemServicoFactory(estabelecimento=self.estabelecimento, servico=self.servico_1, status='FINALIZADO')
        os1.horario_finalizacao = timezone.localtime()
        os1.save()
        
        os2 = OrdemServicoFactory(estabelecimento=self.estabelecimento, servico=self.servico_2, status='FINALIZADO')
        os2.horario_finalizacao = timezone.localtime()
        os2.save()
        
        # OS em outro dia, não deve contar
        os3 = OrdemServicoFactory(estabelecimento=self.estabelecimento, servico=self.servico_1, status='FINALIZADO')
        os3.horario_finalizacao = timezone.localtime() - timedelta(days=1)
        os3.save()
        
        # OS com status não finalizado
        os4 = OrdemServicoFactory(estabelecimento=self.estabelecimento, servico=self.servico_2, status='EM_EXECUCAO')
        os4.save()
        
        self.client.force_authenticate(user=self.user_gestor)
        
        response = self.client.get(f"{self.url_indicadores}?data={hoje.strftime('%Y-%m-%d')}")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Espera 2 OS finalizadas e soma de 170.00 de receita
        self.assertEqual(response.data['totalOsFinalizadas'], 2)
        self.assertEqual(response.data['receitaTotal'], 170.00)

    def test_dashboard_isolamento_idor(self):
        """Teste 3: Garantir erro de permissão caso não seja o gestor."""
        user_comum = UserFactory(username='user_comum')
        self.client.force_authenticate(user=user_comum)
        
        response = self.client.get(self.url_indicadores)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
