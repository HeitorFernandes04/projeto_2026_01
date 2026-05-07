import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lava_me.settings')
django.setup()

from accounts.models import User, Estabelecimento, Gestor

def repair_data():
    est, _ = Estabelecimento.objects.get_or_create(
        cnpj="12345678000199",
        defaults={"nome_fantasia": "Lava-Me Matriz", "endereco_completo": "Rua 1"}
    )
    
    # Busca ou cria o admin de forma segura
    user = User.objects.filter(username="admin").first()
    if not user:
        user = User.objects.create_user(username="admin", email="admin@lavame.com.br", password="adminpassword123", name="Gestor")
    
    user.email = "admin@lavame.com.br"
    user.save()
    
    # Garante o vínculo de Gestor
    Gestor.objects.get_or_create(user=user, defaults={"estabelecimento": est})
    print("Dados reparados! Login: admin@lavame.com.br / Senha: adminpassword123")

if __name__ == "__main__":
    repair_data()
