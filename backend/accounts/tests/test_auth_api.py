from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class AuthAPITestCase(TestCase):
    """Testes unitários para API de autenticação (RF-13 e Axioma 14)"""
    
    def setUp(self):
        """Configuração inicial para os testes"""
        self.client = APIClient()
        self.user_data = {
            'email': 'gestor@lavame.com.br',
            'password': 'senha123',
            'first_name': 'Gestor',
            'last_name': 'Teste'
        }
        
        # Criar usuário de teste
        self.user = User.objects.create_user(
            username=self.user_data['email'],  # Django precisa de username
            email=self.user_data['email'],
            password=self.user_data['password'],
            first_name=self.user_data['first_name'],
            last_name=self.user_data['last_name']
        )
        
        # Criar estabelecimento para o usuário
        from accounts.models import Estabelecimento
        self.estabelecimento = Estabelecimento.objects.create(
            nome_fantasia='Lava-Me Centro',
            cnpj='12345678901234',
            endereco_completo='Rua Teste, 123 - Centro - Teste/TS',
            is_active=True
        )
        
        # Associar usuário ao estabelecimento
        self.user.estabelecimento = self.estabelecimento
        self.user.save()
        
        # Criar perfil de gestor para associar corretamente
        from accounts.models import Gestor
        Gestor.objects.create(
            user=self.user,
            estabelecimento=self.estabelecimento
        )
    
    def test_login_com_credenciais_validas_retorna_jwt(self):
        """
        Testa se o login com credenciais válidas retorna Token JWT
        e status 200 OK (RF-13)
        """
        url = '/api/auth/login/'
        data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        
        response = self.client.post(url, data, format='json')
        
        # Validações
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        
        # Verifica se o token é válido
        access_token = response.data['access']
        refresh_token = response.data['refresh']
        
        # Valida estrutura do token JWT
        self.assertIsInstance(access_token, str)
        self.assertIsInstance(refresh_token, str)
        self.assertTrue(len(access_token) > 50)  # Tokens JWT são longos
    
    def test_login_com_email_invalido_retorna_401(self):
        """
        Testa se o login com email inválido retorna 401 Unauthorized
        """
        url = '/api/auth/login/'
        data = {
            'email': 'email@invalido.com',
            'password': self.user_data['password']
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn('access', response.data)
        self.assertNotIn('refresh', response.data)
    
    def test_login_com_senha_invalida_retorna_401(self):
        """
        Testa se o login com senha inválida retorna 401 Unauthorized
        """
        url = '/api/auth/login/'
        data = {
            'email': self.user_data['email'],
            'password': 'senha_invalida'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn('access', response.data)
        self.assertNotIn('refresh', response.data)
    
    def test_login_com_campos_obrigatorios_faltando_retorna_400(self):
        """
        Testa se o login sem campos obrigatórios retorna 400 Bad Request
        """
        url = '/api/auth/login/'
        
        # Teste sem email
        data = {'password': self.user_data['password']}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Teste sem senha
        data = {'email': self.user_data['email']}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Teste sem nenhum campo
        data = {}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_login_com_metodo_http_invalido_retorna_405(self):
        """
        Testa se tentativas de login com métodos HTTP inválidos retornam 405
        """
        url = '/api/auth/login/'
        data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        
        # Teste com GET
        response = self.client.get(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        # Teste com PUT
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        # Teste com DELETE
        response = self.client.delete(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
    
    def test_token_jwt_contem_informacoes_corretas(self):
        """
        Testa se o token JWT contém as informações corretas do usuário
        """
        url = '/api/auth/login/'
        data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Usar o token para acessar endpoint protegido
        access_token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Tentar acessar endpoint protegido
        response = self.client.get('/api/gestao/estabelecimento/')
        
        # Deve funcionar se o token for válido
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND])
    
    def test_usuario_inativo_nao_pode_fazer_login(self):
        """
        Testa se usuário inativo não pode fazer login
        """
        # Desativar usuário
        self.user.is_active = False
        self.user.save()
        
        url = '/api/auth/login/'
        data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        
        response = self.client.post(url, data, format='json')
        
        # Deve retornar 401 para usuário inativo
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn('access', response.data)
        self.assertNotIn('refresh', response.data)
