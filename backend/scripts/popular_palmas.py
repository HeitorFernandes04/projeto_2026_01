import os
import sys
import django

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lava_me.settings')
django.setup()

from accounts.models import Estabelecimento, User, Gestor, Funcionario
from core.models import Servico, TagPeca

def run():
    print("Iniciando a criação de 4 novos estabelecimentos em Palmas - TO...")

    dados_estabelecimentos = [
        {
            "nome_fantasia": "Brilho do Sol Lava Rápido",
            "cnpj": "11111111000111",
            "endereco_completo": "Quadra 104 Sul, Rua SE 3, Palmas - TO",
            "latitude": -10.1844,
            "longitude": -48.3336,
            "slug": "brilho-do-sol-palmas",
            "prefixo_user": "brilho"
        },
        {
            "nome_fantasia": "Palmas Wash Premium",
            "cnpj": "22222222000122",
            "endereco_completo": "Avenida Joaquim Teotônio Segurado, Palmas - TO",
            "latitude": -10.1900,
            "longitude": -48.3300,
            "slug": "palmas-wash-premium",
            "prefixo_user": "palmaswash"
        },
        {
            "nome_fantasia": "Estética Automotiva Taquaralto",
            "cnpj": "33333333000133",
            "endereco_completo": "Av. Tocantins, Taquaralto, Palmas - TO",
            "latitude": -10.3000,
            "longitude": -48.3500,
            "slug": "estetica-taquaralto",
            "prefixo_user": "taquaralto"
        },
        {
            "nome_fantasia": "Lava Jato Graciosa",
            "cnpj": "44444444000144",
            "endereco_completo": "Orla da Praia da Graciosa, Palmas - TO",
            "latitude": -10.1750,
            "longitude": -48.3600,
            "slug": "lava-jato-graciosa",
            "prefixo_user": "graciosa"
        }
    ]

    pecas_padrao = [
        ("Para-choque Dianteiro", "EXTERNO"),
        ("Para-choque Traseiro", "EXTERNO"),
        ("Porta Motorista", "EXTERNO"),
        ("Painel Central", "INTERNO"),
        ("Bancos Dianteiros", "INTERNO"),
    ]

    for dados in dados_estabelecimentos:
        prefixo = dados.pop("prefixo_user")
        cnpj = dados.pop("cnpj")
        
        # 1. Criação do Estabelecimento
        est, _ = Estabelecimento.objects.get_or_create(
            cnpj=cnpj,
            defaults={
                "nome_fantasia": dados["nome_fantasia"],
                "endereco_completo": dados["endereco_completo"],
                "horario_abertura": "08:00",
                "horario_fechamento": "18:00",
                "is_active": True,
                "slug": dados["slug"],
                "latitude": dados["latitude"],
                "longitude": dados["longitude"],
                "avaliacao_media": 4.8
            }
        )
        print(f"-> Estabelecimento criado: {est.nome_fantasia}")

        # 2. Usuários (1 Gestor, 2 Funcionários)
        gestor_user, _ = User.objects.get_or_create(
            username=f"gestor_{prefixo}",
            defaults={"email": f"gestor@{prefixo}.com", "name": f"Gestor {est.nome_fantasia}"}
        )
        gestor_user.set_password("Banca@2026")
        gestor_user.is_staff = True
        gestor_user.save()
        Gestor.objects.get_or_create(user=gestor_user, estabelecimento=est)

        for i in range(1, 3):
            func_user, _ = User.objects.get_or_create(
                username=f"func{i}_{prefixo}",
                defaults={"email": f"func{i}@{prefixo}.com", "name": f"Lavador {i} {est.nome_fantasia}"}
            )
            func_user.set_password("Banca@2026")
            func_user.is_staff = True
            func_user.save()
            Funcionario.objects.get_or_create(user=func_user, estabelecimento=est, defaults={"cargo": "LAVADOR"})

        # 3. Tags de Peças (Vistoria)
        for nome_peca, cat_peca in pecas_padrao:
            TagPeca.objects.get_or_create(
                estabelecimento=est,
                nome=nome_peca,
                defaults={"categoria": cat_peca}
            )

        # 4. Serviços Básicos
        Servico.objects.get_or_create(
            nome="Ducha Express",
            estabelecimento=est,
            defaults={"preco": 40.00, "duracao_estimada_minutos": 30, "is_active": True}
        )
        Servico.objects.get_or_create(
            nome="Lavagem Premium",
            estabelecimento=est,
            defaults={"preco": 85.00, "duracao_estimada_minutos": 60, "is_active": True}
        )
        Servico.objects.get_or_create(
            nome="Higienização Interna",
            estabelecimento=est,
            defaults={"preco": 150.00, "duracao_estimada_minutos": 120, "is_active": True}
        )

    print("\n✅ 4 Estabelecimentos em Palmas criados com sucesso!")
    print("As senhas para todos os gestores e funcionários são: Banca@2026")

if __name__ == '__main__':
    run()
