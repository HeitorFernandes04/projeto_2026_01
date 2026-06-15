import os
import sys
import django
from datetime import timedelta
from django.utils import timezone

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lava_me.settings')
django.setup()

from accounts.models import Estabelecimento, User, Gestor, Funcionario, Cliente
from core.models import Servico, Veiculo
from operacao.models import OrdemServico

def run():
    print("Iniciando a criação de dados para a Banca...")

    # 1. Estabelecimento
    est, created = Estabelecimento.objects.get_or_create(
        cnpj="12345678000199",
        defaults={
            "nome_fantasia": "Lava Rápido Premium",
            "endereco_completo": "Av. Principal, 1000 - Centro",
            "horario_abertura": "08:00",
            "horario_fechamento": "18:00",
            "is_active": True,
            "slug": "lavarapidopremium"
        }
    )

    # 2. Usuários e Perfis
    # Gestor
    user_gestor, _ = User.objects.get_or_create(
        username="gestor",
        defaults={
            "email": "gestor@lavame.com.br",
            "name": "Carlos Gestor"
        }
    )
    user_gestor.set_password("Banca@2026")
    user_gestor.is_staff = True
    user_gestor.save()
    Gestor.objects.get_or_create(user=user_gestor, estabelecimento=est)

    # Funcionario
    user_func, _ = User.objects.get_or_create(
        username="funcionario",
        defaults={
            "email": "funcionario@lavame.com.br",
            "name": "João Lavador"
        }
    )
    user_func.set_password("Banca@2026")
    user_func.is_staff = True
    user_func.save()
    Funcionario.objects.get_or_create(
        user=user_func, 
        estabelecimento=est,
        defaults={"cargo": "LAVADOR"}
    )

    # Cliente
    user_cliente, _ = User.objects.get_or_create(
        username="cliente",
        defaults={
            "email": "cliente@lavame.com.br",
            "name": "Maria Silva"
        }
    )
    user_cliente.set_password("Banca@2026")
    user_cliente.save()
    cliente, _ = Cliente.objects.get_or_create(
        user=user_cliente, 
        defaults={"telefone_whatsapp": "11988887777"}
    )

    # 3. Serviços
    s1, _ = Servico.objects.get_or_create(
        nome="Ducha Simples",
        estabelecimento=est,
        defaults={
            "preco": 35.00,
            "duracao_estimada_minutos": 30,
            "is_active": True
        }
    )
    
    s2, _ = Servico.objects.get_or_create(
        nome="Lavagem Completa",
        estabelecimento=est,
        defaults={
            "preco": 70.00,
            "duracao_estimada_minutos": 60,
            "is_active": True
        }
    )

    s3, _ = Servico.objects.get_or_create(
        nome="Polimento Cristalizado",
        estabelecimento=est,
        defaults={
            "preco": 250.00,
            "duracao_estimada_minutos": 180,
            "is_active": True
        }
    )

    # 4. Veículo
    veiculo, _ = Veiculo.objects.get_or_create(
        placa="ABC1234",
        defaults={
            "marca": "Toyota",
            "modelo": "Corolla",
            "cor": "Prata",
            "cliente": cliente,
            "estabelecimento": est,
            "nome_dono": "Maria Silva",
            "celular_dono": "11988887777"
        }
    )

    # 5. Ordens de Serviço (Agendamentos e Histórico)
    agora = timezone.now()
    
    # OS 1 - Finalizada (Para mostrar histórico)
    OrdemServico.objects.get_or_create(
        veiculo=veiculo,
        estabelecimento=est,
        servico=s2,
        status="FINALIZADO",
        defaults={
            "data_hora": agora - timedelta(days=2),
            "valor_cobrado": 70.00,
            "observacoes": "Cliente muito satisfeito com o serviço."
        }
    )

    # OS 2 - Em Andamento (Para mostrar painel B2B hoje)
    OrdemServico.objects.get_or_create(
        veiculo=veiculo,
        estabelecimento=est,
        servico=s1,
        status="EM_EXECUCAO",
        defaults={
            "data_hora": agora,
            "valor_cobrado": 35.00,
            "observacoes": "Lavagem rápida, focar nos vidros."
        }
    )

    # OS 3 - Agendada (Para mostrar próximos agendamentos)
    OrdemServico.objects.get_or_create(
        veiculo=veiculo,
        estabelecimento=est,
        servico=s3,
        status="PATIO",
        defaults={
            "data_hora": agora + timedelta(days=1),
            "valor_cobrado": 250.00,
            "observacoes": "Cliente solicitou cuidado extra na pintura."
        }
    )

    print("✅ Dados contextualizados criados com sucesso!")
    print("\n--- CREDENCIAIS PARA A BANCA ---")
    print("GESTOR: gestor / Banca@2026")
    print("FUNCIONÁRIO: funcionario / Banca@2026")
    print("CLIENTE: cliente / Banca@2026")

if __name__ == '__main__':
    run()
