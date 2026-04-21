"""
Script de Seed para popular o banco com dados de teste do Historico do Gestor.
Uso: python seed_historico.py

Cria:
  - 1 Estabelecimento de teste
  - 1 Gestor vinculado ao estabelecimento
  - 1 Funcionario (Lavador)
  - 2 Servicos, 3 Veiculos
  - 3 Ordens de Servico (2 Finalizadas, 1 no Patio)
"""

import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lava_me.settings')
django.setup()

from accounts.models import User, Estabelecimento, Gestor, Funcionario, CargoChoices
from core.models import Servico, Veiculo
from operacao.models import OrdemServico


def get_or_create_user(username, email, name, password):
    """Cria usuario de forma idempotente, evitando conflitos de username/email."""
    user = User.objects.filter(username=username).first()
    if not user:
        user = User.objects.filter(email=email).first()
    if not user:
        user = User.objects.create_user(
            username=username,
            email=email,
            name=name,
            password=password
        )
        print("  [+] Usuario criado: " + email)
    else:
        print("  [~] Usuario ja existe: " + user.email)
    return user


def run():
    print("\n" + "="*50)
    print("   SEED: Populando banco com dados de teste")
    print("="*50)

    # ---- Estabelecimento ----
    estab, created = Estabelecimento.objects.get_or_create(
        cnpj='99999999999999',
        defaults={
            'nome_fantasia': 'Lava Jato Seed',
            'endereco_completo': 'Rua do Teste, 42',
            'is_active': True,
        }
    )
    status_estab = 'criado' if created else 'existente'
    print("\n[1] Estabelecimento " + status_estab + " -> " + estab.nome_fantasia)

    # ---- Gestor ----
    print("\n[2] Criando Gestor...")
    user_gestor = get_or_create_user(
        username='gestor_seed',
        email='gestor_seed@lava.me',
        name='Gestor Seed',
        password='123456'
    )
    Gestor.objects.get_or_create(user=user_gestor, estabelecimento=estab)

    # ---- Lavador ----
    print("\n[3] Criando Lavador...")
    user_lavador = get_or_create_user(
        username='lavador_seed',
        email='lavador_seed@lava.me',
        name='Joao Lavador',
        password='123456'
    )
    Funcionario.objects.get_or_create(
        user=user_lavador,
        estabelecimento=estab,
        defaults={'cargo': CargoChoices.LAVADOR}
    )

    # ---- Servicos ----
    print("\n[4] Criando Servicos...")
    srv1, _ = Servico.objects.get_or_create(
        nome='Lavagem Simples', estabelecimento=estab,
        defaults={'preco': 50.0, 'duracao_estimada_minutos': 30, 'is_active': True}
    )
    srv2, _ = Servico.objects.get_or_create(
        nome='Lavagem Completa', estabelecimento=estab,
        defaults={'preco': 100.0, 'duracao_estimada_minutos': 60, 'is_active': True}
    )
    print("  Servicos: " + srv1.nome + ", " + srv2.nome)

    # ---- Veiculos ----
    # Formato de placa sem hifen (conforme validacao do backend: ABC1234)
    print("\n[5] Criando Veiculos...")
    v1, _ = Veiculo.objects.get_or_create(
        placa='ABC1234', defaults={'modelo': 'Civic', 'marca': 'Honda', 'cor': 'Preto', 'estabelecimento': estab}
    )
    v2, _ = Veiculo.objects.get_or_create(
        placa='XYZ9876', defaults={'modelo': 'Corolla', 'marca': 'Toyota', 'cor': 'Prata', 'estabelecimento': estab}
    )
    v3, _ = Veiculo.objects.get_or_create(
        placa='MNO5555', defaults={'modelo': 'Golf', 'marca': 'VW', 'cor': 'Branco', 'estabelecimento': estab}
    )
    print("  Veiculos: " + v1.placa + ", " + v2.placa + ", " + v3.placa)

    # ---- Ordens de Servico ----
    print("\n[6] Criando Ordens de Servico...")
    agora = timezone.now()

    # OS 1 - Finalizada ontem
    os1, created = OrdemServico.objects.get_or_create(
        veiculo=v1, estabelecimento=estab, status='FINALIZADO',
        defaults={
            'servico': srv1,
            'funcionario': user_lavador,
            'data_hora': agora - timedelta(days=1),
            'horario_lavagem': agora - timedelta(days=1, hours=1),
            'horario_acabamento': agora - timedelta(days=1, minutes=30),
            'horario_finalizacao': agora - timedelta(days=1),
            'comentario_lavagem': 'Lavagem feita com qualidade.',
        }
    )
    s1 = 'criada' if created else 'existente'
    print("  OS " + s1 + " -> Placa " + v1.placa + " | FINALIZADO | Ontem")

    # OS 2 - Finalizada hoje
    os2, created = OrdemServico.objects.get_or_create(
        veiculo=v2, estabelecimento=estab, status='FINALIZADO',
        defaults={
            'servico': srv2,
            'funcionario': user_lavador,
            'data_hora': agora - timedelta(hours=3),
            'horario_lavagem': agora - timedelta(hours=2),
            'horario_acabamento': agora - timedelta(hours=1),
            'horario_finalizacao': agora,
            'comentario_lavagem': 'Lavagem completa finalizada.',
            'comentario_acabamento': 'Acabamento impecavel.',
        }
    )
    s2 = 'criada' if created else 'existente'
    print("  OS " + s2 + " -> Placa " + v2.placa + " | FINALIZADO | Hoje")

    # OS 3 - No Patio (ainda em aberto)
    os3, created = OrdemServico.objects.get_or_create(
        veiculo=v3, estabelecimento=estab, status='PATIO',
        defaults={
            'servico': srv1,
            'funcionario': user_lavador,
            'data_hora': agora + timedelta(hours=1),
        }
    )
    s3 = 'criada' if created else 'existente'
    print("  OS " + s3 + " -> Placa " + v3.placa + " | PATIO | Daqui 1h")

    # ---- Resumo ----
    print("\n" + "="*50)
    print("   SEED CONCLUIDO COM SUCESSO!")
    print("="*50)
    print("\n  Use as credenciais abaixo para logar no Angular:")
    print("    Email: " + user_gestor.email)
    print("    Senha: 123456")
    print("\n  Dados criados:")
    print("    Estabelecimento : " + estab.nome_fantasia)
    print("    OS Finalizadas  : 2 (Placas ABC1234 e XYZ9876)")
    print("    OS no Patio     : 1 (Placa MNO5555)")
    print("="*50 + "\n")


if __name__ == '__main__':
    run()
