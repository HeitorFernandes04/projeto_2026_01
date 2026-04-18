from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import Estabelecimento, Gestor

User = get_user_model()


class TestEstabelecimento(TestCase):
    """Testes para RF-13 - Configurações da Unidade"""

    def setUp(self):
        # Criar estabelecimento
        self.estabelecimento = Estabelecimento.objects.create(
            nome_fantasia='Lava-Me Centro',
            cnpj='12345678000190',
            endereco_completo='Rua das Flores, 123 - Centro - São Paulo - SP'
        )
        
        # Criar gestor
        self.gestor = User.objects.create_user(
            username='gestor',
            email='gestor@lavame.com.br',
            password='test123',
            is_staff=True
        )
        
        # Associar gestor ao estabelecimento
        self.gestor_perfil = Gestor.objects.create(
            user=self.gestor,
            estabelecimento=self.estabelecimento
        )
        
        # Criar outro estabelecimento para teste de isolamento
        self.estabelecimento_b = Estabelecimento.objects.create(
            nome_fantasia='Lava-Me Norte',
            cnpj='12345678000291',
            endereco_completo='Avenida Principal, 456 - Norte - São Paulo - SP'
        )
        
        self.gestor_b = User.objects.create_user(
            username='gestor_b',
            email='gestorb@lavame.com.br',
            password='test123',
            is_staff=True
        )
        
        self.gestor_b_perfil = Gestor.objects.create(
            user=self.gestor_b,
            estabelecimento=self.estabelecimento_b
        )
        
        self.client = APIClient()

    def test_obter_dados_estabelecimento_proprio(self):
        """Testa se gestor pode obter dados do próprio estabelecimento"""
        self.client.force_authenticate(user=self.gestor)
        
        response = self.client.get('/api/gestao/estabelecimento/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nome_fantasia'], 'Lava-Me Centro')
        self.assertEqual(response.data['cnpj'], '12345678000190')
        self.assertEqual(response.data['endereco_completo'], 'Rua das Flores, 123 - Centro - São Paulo - SP')
        self.assertTrue(response.data['is_active'])

    def test_atualizar_dados_estabelecimento_proprio(self):
        """Testa se gestor pode atualizar dados do próprio estabelecimento"""
        self.client.force_authenticate(user=self.gestor)
        
        dados_atualizacao = {
            'nome_fantasia': 'Lava-Me Centro Atualizado',
            'endereco_completo': 'Rua das Flores, 123 - Centro - São Paulo - SP - CEP 01234-567'
        }
        
        response = self.client.patch('/api/gestao/estabelecimento/', dados_atualizacao)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nome_fantasia'], 'Lava-Me Centro Atualizado')
        self.assertEqual(response.data['endereco_completo'], 'Rua das Flores, 123 - Centro - São Paulo - SP - CEP 01234-567')
        self.assertIn('message', response.data)

    def test_atualizar_cnpj_invalido(self):
        """Testa validação de CNPJ inválido"""
        self.client.force_authenticate(user=self.gestor)
        
        dados_atualizacao = {
            'cnpj': '123'  # CNPJ muito curto
        }
        
        response = self.client.patch('/api/gestao/estabelecimento/', dados_atualizacao)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_atualizar_cnpj_duplicado(self):
        """Testa prevenção de CNPJ duplicado"""
        self.client.force_authenticate(user=self.gestor)
        
        dados_atualizacao = {
            'cnpj': '12345678000291'  # CNPJ do outro estabelecimento
        }
        
        response = self.client.patch('/api/gestao/estabelecimento/', dados_atualizacao)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_isolamento_multi_tenant(self):
        """Testa RNF-01: Gestor só pode acessar seu próprio estabelecimento"""
        self.client.force_authenticate(user=self.gestor)
        
        response = self.client.get('/api/gestao/estabelecimento/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Garante que retorna dados do estabelecimento correto
        self.assertEqual(response.data['nome_fantasia'], 'Lava-Me Centro')
        self.assertNotEqual(response.data['nome_fantasia'], 'Lava-Me Norte')

    def test_campos_nao_permitidos_sao_ignorados(self):
        """Testa que campos não permitidos são ignorados na atualização"""
        self.client.force_authenticate(user=self.gestor)
        
        dados_atualizacao = {
            'nome_fantasia': 'Lava-Me Centro',
            'campo_nao_permitido': 'valor',
            'outro_campo': 123
        }
        
        response = self.client.patch('/api/gestao/estabelecimento/', dados_atualizacao)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # A atualização deve funcionar ignorando campos não permitidos

    def test_acesso_nao_autenticado_bloqueado(self):
        """Testa que usuários não autenticados não podem acessar"""
        response = self.client.get('/api/gestao/estabelecimento/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_usuario_sem_estabelecimento_bloqueado(self):
        """Testa que usuário sem estabelecimento é bloqueado"""
        usuario_sem_estabelecimento = User.objects.create_user(
            username='sem_estabelecimento',
            email='sem@lavame.com.br',
            password='test123'
        )
        
        self.client.force_authenticate(user=usuario_sem_estabelecimento)
        
        response = self.client.get('/api/gestao/estabelecimento/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
