import threading
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail
from django_rest_passwordreset.models import ResetPasswordToken

User = get_user_model()

class PasswordResetService:
    
    @staticmethod
    def _enviar_email_thread(token_key: str, user_email: str, user_name: str, base_url: str):
        """Task que envia o e-mail em background."""
        link = f"{base_url}/reset-password?token={token_key}"
        subject = "Recuperação de Senha - Lava-Me"
        message = (
            f"Olá {user_name},\n\n"
            f"Você solicitou a redefinição de sua senha na plataforma Lava-Me.\n"
            f"Clique no link a seguir para definir uma nova senha (este link é válido por 15 minutos):\n\n"
            f"{link}\n\n"
            f"Se você não solicitou essa alteração, ignore este e-mail.\n"
            f"Atenciosamente,\nEquipe Lava-Me"
        )
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=None,
                recipient_list=[user_email],
                fail_silently=False
            )
        except Exception as e:
            import logging
            logger = logging.getLogger('accounts')
            logger.error(f"Erro ao enviar email de recuperacao para {user_email}: {e}")


    @staticmethod
    def solicitar_reset(email: str) -> str | None:
        """
        Recebe o e-mail do colaborador, valida permissões, aplica rate limiting,
        gera o token de redefinição e envia o e-mail.
        Retorna a chave do token se gerado, ou None se o e-mail for inválido/cliente (feedback opaco).
        """
        if not email:
            return None
            
        email = email.strip().lower()
        user = User.objects.filter(email__iexact=email).first()
        
        if not user:
            return None
            
        # Isolamento B2C/B2B: Apenas funcionários e gestores podem recuperar senha
        is_gestor = hasattr(user, 'perfil_gestor')
        is_funcionario = hasattr(user, 'perfil_funcionario')
        
        if not (is_gestor or is_funcionario):
            return None
            
        # Rate Limiting: Máximo de 3 solicitações por e-mail a cada 1 hora
        one_hour_ago = timezone.now() - timedelta(hours=1)
        recent_requests = ResetPasswordToken.objects.filter(
            user=user,
            created_at__gte=one_hour_ago
        ).count()
        
        if recent_requests >= 3:
            raise ValidationError("Limite de tentativas excedido. Tente novamente mais tarde.")
            
        # Criação do token seguro via django-rest-passwordreset
        token = ResetPasswordToken.objects.create(user=user)
        
        # Define a URL base dependendo do perfil
        from django.conf import settings
        if is_gestor:
            base_url = settings.FRONTEND_GESTOR_URL
        else:
            base_url = settings.FRONTEND_FUNCIONARIO_URL

        # Aciona o envio de e-mail de forma assíncrona via Thread nativa (ou síncrona nos testes)
        import sys
        if 'pytest' in sys.modules:
            PasswordResetService._enviar_email_thread(token.key, user.email, user.name or user.username, base_url)
        else:
            thread = threading.Thread(
                target=PasswordResetService._enviar_email_thread,
                args=(token.key, user.email, user.name or user.username, base_url)
            )
            thread.start()
        
        return token.key

    @staticmethod
    def confirmar_reset(token_key: str, nova_senha: str) -> None:
        """
        Recebe o token e a nova senha, valida a expiração de 15 minutos,
        as regras de segurança da senha e atualiza no banco de dados.
        """
        if not token_key or not nova_senha:
            raise ValidationError("Token e senha são obrigatórios.")
            
        token = ResetPasswordToken.objects.filter(key=token_key).select_related('user').first()
        if not token:
            raise ValidationError("Token inválido ou expirado.")
            
        # Expiração de 15 minutos estrita
        expiry_limit = token.created_at + timedelta(minutes=15)
        if timezone.now() > expiry_limit:
            raise ValidationError("Token inválido ou expirado.")
            
        user = token.user
        
        # Validação de força da senha conforme as regras do Django configuradas no settings.py
        validate_password(nova_senha, user=user)
        
        # Atualização da senha de forma segura
        user.set_password(nova_senha)
        user.save()
        
        # Invalidação de todos os tokens anteriores para este usuário
        ResetPasswordToken.objects.filter(user=user).delete()
