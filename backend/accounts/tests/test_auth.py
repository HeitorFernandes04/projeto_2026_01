import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from atendimentos.tests.factories import UserFactory


@pytest.mark.django_db
class TestRegistroAuth:

    def test_cadastro_normaliza_email_trailing_spaces(self):
        """FASE 2: E-mail com espaços deve ser salvo sem eles (strip + lower)."""
        client = APIClient()
        url = reverse('register')
        response = client.post(url, {
            'name': 'Teste',
            'email': '  TESTE@LAVAME.COM  ',
            'username': 'testelava',
            'password': 'senha123',
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
        response = client.post(url, {
            'name': 'Outro',
            'email': 'existente@lavame.com',
            'username': 'outro_user',
            'password': 'senha456',
        }, format='json')

        assert response.status_code == 400
        resposta_str = str(response.data).lower()
        assert 'e-mail já está cadastrado' in resposta_str or 'email' in resposta_str

    def test_login_com_email_normalizado(self):
        """Usuário criado com e-mail normalizado deve conseguir logar normalmente."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        User.objects.create_user(
            name='Login Test',
            email='login@lavame.com',
            username='logintest',
            password='senha789',
        )
        client = APIClient()
        url = reverse('login')
        response = client.post(url, {
            'email': 'login@lavame.com',
            'password': 'senha789',
        }, format='json')

        assert response.status_code == 200
        assert 'access' in response.data
