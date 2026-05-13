"""
RF-27.5 — Reset e Seed de Dados

Popula o banco de desenvolvimento com dados mínimos compatíveis
com o schema da Sprint 4. Seguro para reexecução (idempotente via get_or_create).

Uso:
    python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import CargoChoices, Estabelecimento, Funcionario, Gestor, User
from core.models import Servico, Veiculo
from operacao.models import OrdemServico


SEED_CNPJ = '00000000000001'
GESTOR_EMAIL = 'gestor@lavame.dev'
FUNCIONARIO_EMAIL = 'operador@lavame.dev'
SENHA_PADRAO = 'LavaMe2026!'


class Command(BaseCommand):
    help = 'Popula o banco de desenvolvimento com dados compatíveis com o schema da Sprint 4 (RF-27.5).'

    def handle(self, *args, **options):
        self.stdout.write('Iniciando seed de dados...\n')

        # 1. Estabelecimento (com geolocalização — RF-27.1)
        est, criado = Estabelecimento.objects.get_or_create(
            cnpj=SEED_CNPJ,
            defaults={
                'nome_fantasia': 'Lava-Me Sede Dev',
                'endereco_completo': 'Av. Brasil, 1000 - São Paulo/SP',
                'is_active': True,
                'horario_abertura': '08:00',
                'horario_fechamento': '18:00',
                'latitude': -23.5505,
                'longitude': -46.6333,
            },
        )
        self._log('Estabelecimento', est.nome_fantasia, criado)

        # 2. Gestor
        gestor_user, criado = User.objects.get_or_create(
            email=GESTOR_EMAIL,
            defaults={'username': 'gestor_dev', 'name': 'Gestor Dev'},
        )
        if criado:
            gestor_user.set_password(SENHA_PADRAO)
            gestor_user.save()
        Gestor.objects.get_or_create(user=gestor_user, defaults={'estabelecimento': est})
        self._log('Gestor', GESTOR_EMAIL, criado)

        # 3. Funcionário (cargo LAVADOR — DETALHISTA removido no RF-27.4)
        func_user, criado = User.objects.get_or_create(
            email=FUNCIONARIO_EMAIL,
            defaults={'username': 'operador_dev', 'name': 'Operador Dev'},
        )
        if criado:
            func_user.set_password(SENHA_PADRAO)
            func_user.save()
        Funcionario.objects.get_or_create(
            user=func_user,
            defaults={'estabelecimento': est, 'cargo': CargoChoices.LAVADOR},
        )
        self._log('Funcionário', FUNCIONARIO_EMAIL, criado)

        # 4. Serviço
        servico, criado = Servico.objects.get_or_create(
            estabelecimento=est,
            nome='Lavagem Completa',
            defaults={'preco': 60.00, 'duracao_estimada_minutos': 45, 'is_active': True},
        )
        self._log('Serviço', servico.nome, criado)

        # 5. Veículo
        veiculo, criado = Veiculo.objects.get_or_create(
            placa='ABC1234',
            defaults={
                'estabelecimento': est,
                'modelo': 'Gol',
                'marca': 'VW',
                'cor': 'Prata',
            },
        )
        self._log('Veículo', veiculo.placa, criado)

        # 6. Ordem de Serviço (etapa_atual=0, sem campos de acabamento — RF-27.2/27.3)
        os_obj, criado = OrdemServico.objects.get_or_create(
            veiculo=veiculo,
            status='PATIO',
            defaults={
                'estabelecimento': est,
                'servico': servico,
                'funcionario': func_user,
                'data_hora': timezone.now(),
                'etapa_atual': 0,
            },
        )
        self._log('Ordem de Serviço', f'#{os_obj.pk} — {os_obj.status}', criado)

        self.stdout.write(self.style.SUCCESS('\nSeed concluído com sucesso! (RNF-01: integridade garantida)'))
        self.stdout.write(f'  Gestor:     {GESTOR_EMAIL} / {SENHA_PADRAO}')
        self.stdout.write(f'  Operador:   {FUNCIONARIO_EMAIL} / {SENHA_PADRAO}')

    def _log(self, tipo, nome, criado):
        status = 'criado' if criado else 'já existia'
        self.stdout.write(f'  {tipo}: {nome} ({status})')
