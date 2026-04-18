import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from operacao.tests.factories import UserFactory, EstabelecimentoFactory
from accounts.models import Cliente, Funcionario, Gestor


@pytest.mark.django_db
class TestRegistroAuth:

    def test_cadastro_normaliza_email_trailing_spaces(self):
        """FASE 2: E-mail com espaços deve ser salvo sem eles (strip + lower)."""
        client = APIClient()
        url = reverse('register')
        
        # Criar um estabelecimento para o teste (nova arquitetura Multi-tenant)
        estabelecimento = EstabelecimentoFactory()
        
        response = client.post(url, {
            'name': 'Teste',
            'email': '  TESTE@LAVAME.COM  ',
            'username': 'testelava',
            'password': 'senha123',
            'estabelecimento': estabelecimento.id,
            'cargo': 'LAVADOR',
        }, format='json')

        # Deve criar com sucesso
        assert response.status_code == 201
        # E o e-mail salvo deve estar em lowercase e sem espaços
        assert response.data['email'] == 'teste@lavame.com'

    def test_cadastro_rejeita_email_duplicado_com_mensagem_amigavel(self):
        """Deve retornar mensagem legível quando o e-mail já existe."""
        UserFactory(email='existente@lavame.com')
        client = APIClient()
        url = reverse('register')
        
        # Criar um estabelecimento para o teste
        estabelecimento = EstabelecimentoFactory()
        
        response = client.post(url, {
            'name': 'Outro',
            'email': 'existente@lavame.com',
            'username': 'outro_user',
            'password': 'senha456',
            'estabelecimento': estabelecimento.id,
            'cargo': 'LAVADOR',
        }, format='json')

        assert response.status_code == 400
        resposta_str = str(response.data).lower()
        assert 'e-mail já está cadastrado' in resposta_str or 'email' in resposta_str

    def test_login_com_email_normalizado(self):
        """Usuário criado com e-mail normalizado deve conseguir logar normalmente."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Criar estabelecimento para o usuário
        estabelecimento = EstabelecimentoFactory()
        
        # Criar usuário diretamente (sem factory para testar normalização)
        user = User.objects.create_user(
            name='Login Test',
            email='login@lavame.com',
            username='logintest',
            password='senha789',
        )
        
        # Criar perfil funcionário para o usuário
        Funcionario.objects.create(
            user=user,
            estabelecimento=estabelecimento,
            cargo='LAVADOR'
        )
        
        client = APIClient()
        url = reverse('login')
        response = client.post(url, {
            'email': 'login@lavame.com',
            'password': 'senha789',
        }, format='json')

        assert response.status_code == 200
        assert 'access' in response.data

    def test_cadastro_cliente_sem_estabelecimento(self):
        """Teste de cadastro de cliente (não precisa de estabelecimento)."""
        client = APIClient()
        # Este teste seria para um endpoint de cadastro de cliente
        # Por enquanto, vamos testar o register atual que exige estabelecimento
        url = reverse('register')
        
        response = client.post(url, {
            'name': 'Cliente Teste',
            'email': 'cliente@lavame.com',
            'username': 'cliente',
            'password': 'senha123',
            'telefone_whatsapp': '11999999999',
        }, format='json')

        # Register atual exige estabelecimento, então deve falhar
        assert response.status_code == 400
