import factory
from django.utils import timezone
from accounts.models import User
from atendimentos.models import Atendimento, IncidenteOS, MidiaAtendimento, Servico, TagPeca, Veiculo

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
    username = factory.Sequence(lambda n: f'operador_{n}')
    email = factory.LazyAttribute(lambda o: f'{o.username}@lava.me')
    password = factory.PostGenerationMethodCall('set_password', 'senha12345')

class ServicoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Servico
    nome = 'Lavagem Industrial'
    preco = 50.00
    duracao_estimada_min = 30

class VeiculoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Veiculo
    placa = factory.Sequence(lambda n: f'AAA000{n}')
    modelo = 'Gol'
    marca = 'VW'
    nome_dono = 'Cliente Teste'

class AtendimentoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Atendimento
    veiculo = factory.SubFactory(VeiculoFactory)
    servico = factory.SubFactory(ServicoFactory)
    funcionario = factory.SubFactory(UserFactory)
    data_hora = factory.LazyFunction(timezone.now)
    status = 'agendado'

class MidiaAtendimentoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = MidiaAtendimento
    atendimento = factory.SubFactory(AtendimentoFactory)
    arquivo = factory.django.ImageField(color='blue')
    momento = 'VISTORIA_GERAL' # Categorias atualizadas

class TagPecaFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TagPeca
    nome = factory.Sequence(lambda n: f'Peça_{n}')
    categoria = 'CARROCERIA'

class IncidenteOSFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = IncidenteOS
    atendimento = factory.SubFactory(AtendimentoFactory)
    tag_peca = factory.SubFactory(TagPecaFactory)
    descricao = 'Risco no para-choque detectado'
    foto_url = factory.django.ImageField(color='red')