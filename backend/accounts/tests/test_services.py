import pytest
from datetime import timedelta
from django.utils import timezone
from django.core import mail
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django_rest_passwordreset.models import ResetPasswordToken

from operacao.tests.factories import GestorFactory, UserFactory, ClienteFactory, EstabelecimentoFactory
from accounts.services import PasswordResetService

User = get_user_model()

@pytest.mark.django_db
class TestPasswordResetService:
    
    def test_solicitar_reset_gestor_valido_envia_email(self):
        """Gestor ativo solicita redefinição: gera token e envia e-mail com link."""
        gestor = GestorFactory()
        user = gestor.user
        
        token = PasswordResetService.solicitar_reset(user.email)
        
        assert token is not None
        assert ResetPasswordToken.objects.filter(user=user, key=token).exists()
        assert len(mail.outbox) == 1
        assert "reset-password?token=" in mail.outbox[0].body
        assert token in mail.outbox[0].body

    def test_solicitar_reset_funcionario_valido_envia_email(self):
        """Funcionário ativo solicita redefinição: gera token e envia e-mail."""
        est = EstabelecimentoFactory()
        funcionario = UserFactory(estabelecimento=est)
        
        token = PasswordResetService.solicitar_reset(funcionario.email)
        
        assert token is not None
        assert ResetPasswordToken.objects.filter(user=funcionario, key=token).exists()
        assert len(mail.outbox) == 1

    def test_solicitar_reset_cliente_b2c_nao_gera_token_nem_envia_email(self):
        """Cliente final (B2C) tenta solicitar redefinição: não gera token nem envia e-mail."""
        cliente = ClienteFactory()
        user = cliente.user
        
        token = PasswordResetService.solicitar_reset(user.email)
        
        assert token is None
        assert not ResetPasswordToken.objects.filter(user=user).exists()
        assert len(mail.outbox) == 0

    def test_solicitar_reset_email_inexistente_nao_gera_token_nem_envia_email(self):
        """E-mail não cadastrado na base: não gera token nem envia e-mail."""
        token = PasswordResetService.solicitar_reset("inexistente@lava.me")
        
        assert token is None
        assert len(mail.outbox) == 0

    def test_solicitar_reset_rate_limit_excedido(self):
        """Bloqueia após 3 solicitações válidas de redefinição no período de 1 hora."""
        gestor = GestorFactory()
        user = gestor.user
        
        # 3 solicitações bem-sucedidas
        for _ in range(3):
            PasswordResetService.solicitar_reset(user.email)
            
        # A 4ª deve disparar ValidationError (Rate Limit de 3 solicitações por hora)
        with pytest.raises(ValidationError) as exc:
            PasswordResetService.solicitar_reset(user.email)
            
        assert "Limite de tentativas excedido. Tente novamente mais tarde." in str(exc.value)

    def test_confirmar_reset_sucesso_atualiza_senha_e_limpa_tokens(self):
        """Confirmação com token válido altera a senha do usuário e invalida os tokens antigos."""
        gestor = GestorFactory()
        user = gestor.user
        token = PasswordResetService.solicitar_reset(user.email)
        
        PasswordResetService.confirmar_reset(token, "NovaSenhaSegura123!")
        
        user.refresh_from_db()
        assert user.check_password("NovaSenhaSegura123!")
        assert not ResetPasswordToken.objects.filter(user=user).exists()

    def test_confirmar_reset_token_expirado_falha(self):
        """Token gerado a mais de 15 minutos é considerado inválido."""
        gestor = GestorFactory()
        user = gestor.user
        token_key = PasswordResetService.solicitar_reset(user.email)
        
        # Simula expiração alterando o created_at do token no BD
        token = ResetPasswordToken.objects.get(key=token_key)
        token.created_at = timezone.now() - timedelta(minutes=16)
        token.save()
        
        with pytest.raises(ValidationError) as exc:
            PasswordResetService.confirmar_reset(token_key, "NovaSenhaSegura123!")
            
        assert "Token inválido ou expirado." in str(exc.value)
