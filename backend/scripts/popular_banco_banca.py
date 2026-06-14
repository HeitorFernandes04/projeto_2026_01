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
        nome="Lava Rápido Premium",
        cnpj="12345678000199",
        defaults={
            "telefone": "11999999999",
            "endereco": "Av. Principal, 1000 - Centro",
            "horario_funcionamento": "Seg-Sáb, 08h-18h",
            "ativo": True,
            "slug_autoagendamento": "lavarapidopremium"
        }
    )

    # 2. Usuários e Perfis
    # Gestor
    user_gestor, _ = User.objects.get_or_create(
        username="gestor",
        defaults={
            "email": "gestor@lavame.com.br",
            "first_name": "Carlos",
            "last_name": "Gestor",
            "is_staff": True,
            "tipo": "GESTOR"
        }
    )
    user_gestor.set_password("Banca@2026")
    user_gestor.save()
    Gestor.objects.get_or_create(user=user_gestor, estabelecimento=est)

    # Funcionario
    user_func, _ = User.objects.get_or_create(
        username="funcionario",
        defaults={
            "email": "funcionario@lavame.com.br",
            "first_name": "João",
            "last_name": "Lavador",
            "is_staff": True,
            "tipo": "FUNCIONARIO"
        }
    )
    user_func.set_password("Banca@2026")
    user_func.save()
    Funcionario.objects.get_or_create(
        user=user_func, 
        estabelecimento=est,
        cargo="LAVADOR"
    )

    # Cliente
    user_cliente, _ = User.objects.get_or_create(
        username="cliente",
        defaults={
            "email": "cliente@lavame.com.br",
            "first_name": "Maria",
            "last_name": "Silva",
            "tipo": "CLIENTE",
            "whatsapp": "11988887777"
        }
    )
    user_cliente.set_password("Banca@2026")
    user_cliente.save()
    cliente, _ = Cliente.objects.get_or_create(user=user_cliente, defaults={"telefone": "11988887777"})

    # 3. Serviços
    s1, _ = Servico.objects.get_or_create(
        nome="Ducha Simples",
        estabelecimento=est,
        defaults={
            "descricao": "Lavagem externa rápida com shampoo automotivo.",
            "preco": 35.00,
            "duracao_estimada": 30,
            "ativo": True
        }
    )
    
    s2, _ = Servico.objects.get_or_create(
        nome="Lavagem Completa",
        estabelecimento=est,
        defaults={
            "descricao": "Lavagem externa e limpeza interna detalhada com aspiração.",
            "preco": 70.00,
            "duracao_estimada": 60,
            "ativo": True
        }
    )

    s3, _ = Servico.objects.get_or_create(
        nome="Polimento Cristalizado",
        estabelecimento=est,
        defaults={
            "descricao": "Polimento técnico com aplicação de cera cristalizadora de alta durabilidade.",
            "preco": 250.00,
            "duracao_estimada": 180,
            "ativo": True
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
            "tipo": "SEDAN"
        }
    )

    # 5. Ordens de Serviço (Agendamentos e Histórico)
    agora = timezone.now()
    
    # OS 1 - Finalizada (Para mostrar histórico)
    OrdemServico.objects.get_or_create(
        data_agendamento=agora - timedelta(days=2),
        veiculo=veiculo,
        estabelecimento=est,
        defaults={
            "cliente": cliente,
            "servico": s2,
            "status": "FINALIZADA",
            "valor_total": 70.00,
            "observacoes": "Cliente muito satisfeito com o serviço."
        }
    )

    # OS 2 - Em Andamento (Para mostrar painel B2B hoje)
    OrdemServico.objects.get_or_create(
        data_agendamento=agora,
        veiculo=veiculo,
        estabelecimento=est,
        defaults={
            "cliente": cliente,
            "servico": s1,
            "status": "EM_ANDAMENTO",
            "valor_total": 35.00,
            "observacoes": "Lavagem rápida, focar nos vidros."
        }
    )

    # OS 3 - Agendada (Para mostrar próximos agendamentos)
    OrdemServico.objects.get_or_create(
        data_agendamento=agora + timedelta(days=1),
        veiculo=veiculo,
        estabelecimento=est,
        defaults={
            "cliente": cliente,
            "servico": s3,
            "status": "AGENDADA",
            "valor_total": 250.00,
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
