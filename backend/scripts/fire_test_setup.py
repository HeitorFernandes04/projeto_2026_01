import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lava_me.settings')
import sys
sys.path.append('/home/wanderson/PS2026/projeto_2026_01/backend')
django.setup()

from accounts.models import User, Gestor, Estabelecimento
from rest_framework_simplejwt.tokens import RefreshToken

def fire_test_setup():
    print("🚀 Iniciando Setup do Teste de Fogo...")
    
    # Garantir Unidade e Usuário
    est, _ = Estabelecimento.objects.get_or_create(
        nome_fantasia='Unidade de Teste Fogo', 
        defaults={'cnpj': '88888888000188'}
    )
    
    user, created = User.objects.get_or_create(
        email='gestor_validacao@lavame.com.br',
        defaults={'username': 'gestor_val', 'name': 'Gestor de Validação'}
    )
    
    if created:
        user.set_password('LavaMe123!')
        user.save()
        
    Gestor.objects.get_or_create(user=user, estabelecimento=est)
    
    token = RefreshToken.for_user(user).access_token
    print(f"✅ Usuário pronto. Token gerado.")
    return str(token)

if __name__ == "__main__":
    token = fire_test_setup()
    print(f"RESULT_TOKEN:{token}")
