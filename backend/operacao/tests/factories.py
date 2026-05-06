import factory
from django.utils import timezone

from accounts.models import CargoChoices, Cliente, Estabelecimento, Funcionario, Gestor, User
from core.models import Servico, TagPeca, Veiculo, VistoriaItem
from operacao.models import IncidenteOS, MidiaOrdemServico, OrdemServico


class EstabelecimentoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Estabelecimento

    nome_fantasia = factory.Sequence(lambda n: f'Lava Jato {n}')
    cnpj = factory.Sequence(lambda n: f'{n:014d}')
    endereco_completo = 'Rua de Teste, 123'
    is_active = True


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        skip_postgeneration_save = True

    username = factory.Sequence(lambda n: f'operador_{n}')
    name = factory.Faker('name')
    email = factory.LazyAttribute(lambda o: f'{o.username}@lava.me')
    password = factory.PostGenerationMethodCall('set_password', 'senha12345')

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        estabelecimento = kwargs.pop('estabelecimento', None)
        cargo = kwargs.pop('cargo', CargoChoices.LAVADOR)

        user = super()._create(model_class, *args, **kwargs)

        if estabelecimento:
            Funcionario.objects.create(
                user=user,
                estabelecimento=estabelecimento,
                cargo=cargo,
            )

        return user


class ServicoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Servico

    estabelecimento = factory.SubFactory(EstabelecimentoFactory)
    nome = 'Lavagem Industrial'
    preco = 50.00
    duracao_estimada_minutos = 30
    is_active = True


class VeiculoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Veiculo

    estabelecimento = factory.SubFactory(EstabelecimentoFactory)
    placa = factory.Sequence(lambda n: f'TST{n:04d}')
    modelo = 'Gol'
    marca = 'VW'
    cor = 'Branco'


_PARENT_EST = '..estabelecimento'


class OrdemServicoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = OrdemServico

    estabelecimento = factory.SubFactory(EstabelecimentoFactory)
    veiculo = factory.SubFactory(VeiculoFactory, estabelecimento=factory.SelfAttribute(_PARENT_EST))
    servico = factory.SubFactory(ServicoFactory, estabelecimento=factory.SelfAttribute(_PARENT_EST))
    funcionario = factory.SubFactory(UserFactory, estabelecimento=factory.SelfAttribute(_PARENT_EST))
    data_hora = factory.LazyFunction(timezone.now)
    status = 'PATIO'


class MidiaOrdemServicoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = MidiaOrdemServico

    ordem_servico = factory.SubFactory(OrdemServicoFactory)
    arquivo = factory.django.ImageField(color='blue')
    momento = 'VISTORIA_GERAL'


class TagPecaFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TagPeca

    estabelecimento = factory.SubFactory(EstabelecimentoFactory)
    nome = factory.Sequence(lambda n: f'Peca_{n}')
    categoria = 'EXTERNO'


class ClienteUserFactory(factory.django.DjangoModelFactory):
    """Cria User + Cliente sem estabelecimento."""
    class Meta:
        model = User
        skip_postgeneration_save = True

    username = factory.Sequence(lambda n: f'cliente_{n}')
    name = factory.Faker('name')
    email = factory.LazyAttribute(lambda o: f'{o.username}@cliente.me')
    password = factory.PostGenerationMethodCall('set_password', 'senha12345')


class ClienteFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Cliente

    user = factory.SubFactory(ClienteUserFactory)
    telefone_whatsapp = factory.Sequence(lambda n: f'119999{n:05d}')


class GestorFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Gestor

    user = factory.SubFactory(UserFactory)
    estabelecimento = factory.SubFactory(EstabelecimentoFactory)


class IncidenteOSFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = IncidenteOS

    ordem_servico = factory.SubFactory(OrdemServicoFactory)
    tag_peca = factory.SubFactory(
        TagPecaFactory,
        estabelecimento=factory.SelfAttribute('..ordem_servico.estabelecimento'),
    )
    descricao = factory.Sequence(lambda n: f'Incidente operacional {n}')
    foto_url = factory.django.ImageField(color='red')
    resolvido = False
    status_anterior_os = factory.LazyAttribute(lambda o: o.ordem_servico.status)


class VistoriaItemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = VistoriaItem

    ordem_servico = factory.SubFactory(OrdemServicoFactory)
    tag_peca = factory.SubFactory(
        TagPecaFactory,
        estabelecimento=factory.SelfAttribute('..ordem_servico.estabelecimento'),
    )
    possui_avaria = True
    foto_url = factory.django.ImageField(color='yellow')
