import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.core import mail
from django.contrib.auth import get_user_model
from django_rest_passwordreset.models import ResetPasswordToken

from operacao.tests.factories import GestorFactory, ClienteFactory

User = get_user_model()

@pytest.mark.django_db
class TestPasswordResetAPI:
    client = APIClient()
    
    def test_api_solicitar_reset_colaborador_retorna_200_com_feedback_opaco(self):
        """Solicitação para colaborador válido retorna HTTP 200 com mensagem genérica."""
        gestor = GestorFactory()
        
        response = self.client.post('/api/auth/password-reset/', {'email': gestor.user.email})
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['message'] == "Se o e-mail estiver cadastrado, você receberá instruções em instantes."
        assert len(mail.outbox) == 1

    def test_api_solicitar_reset_email_invalido_retorna_200_com_feedback_opaco(self):
        """Solicitação para e-mail inexistente retorna HTTP 200 com mensagem genérica (Opaque Feedback)."""
        response = self.client.post('/api/auth/password-reset/', {'email': 'naoexiste@lava.me'})
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['message'] == "Se o e-mail estiver cadastrado, você receberá instruções em instantes."
        assert len(mail.outbox) == 0

    def test_api_solicitar_reset_cliente_retorna_200_com_feedback_opaco(self):
        """Solicitação para cliente final (B2C) retorna HTTP 200 com mensagem genérica mas não envia e-mail."""
        cliente = ClienteFactory()
        
        response = self.client.post('/api/auth/password-reset/', {'email': cliente.user.email})
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['message'] == "Se o e-mail estiver cadastrado, você receberá instruções em instantes."
        assert len(mail.outbox) == 0

    def test_api_confirmar_reset_sucesso(self):
        """Endpoint de confirmação altera a senha com sucesso."""
        gestor = GestorFactory()
        token_key = ResetPasswordToken.objects.create(user=gestor.user).key
        
        payload = {
            'token': token_key,
            'password': 'MinhaNovaSenhaForte123!'
        }
        response = self.client.post('/api/auth/password-reset/confirm/', payload)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['message'] == "Senha atualizada com sucesso!"
        
        gestor.user.refresh_from_db()
        assert gestor.user.check_password('MinhaNovaSenhaForte123!')
