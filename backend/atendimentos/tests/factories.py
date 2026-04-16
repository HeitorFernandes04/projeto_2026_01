import factory
from django.utils import timezone
from accounts.models import User
from atendimentos.models import OrdemServico, IncidenteOS, MidiaOrdemServico, Servico, TagPeca, Veiculo

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

class OrdemServicoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = OrdemServico
    veiculo = factory.SubFactory(VeiculoFactory)
    servico = factory.SubFactory(ServicoFactory)
    funcionario = factory.SubFactory(UserFactory)
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
    nome = factory.Sequence(lambda n: f'Peça_{n}')
    categoria = 'frente'

class IncidenteOSFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = IncidenteOS
    ordem_servico = factory.SubFactory(OrdemServicoFactory)
    tag_peca = factory.SubFactory(TagPecaFactory)
    descricao = 'Risco no para-choque detectado'
    foto_url = factory.django.ImageField(color='red')