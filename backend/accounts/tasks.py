from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

@shared_task
def enviar_email_recuperacao_senha(token_key: str, user_email: str, user_name: str):
    """
    Task assíncrona que envia o e-mail de recuperação de senha,
    evitando bloqueio no worker HTTP.
    """
    base_url = "http://localhost:8100" if settings.DEBUG else "https://lava.me"
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
    
    send_mail(
        subject=subject,
        message=message,
        from_email=None,  # Utiliza DEFAULT_FROM_EMAIL do settings
        recipient_list=[user_email],
        fail_silently=False
    )
