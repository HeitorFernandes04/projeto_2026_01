import factory
from django.utils import timezone
from accounts.models import User, Estabelecimento, CargoChoices, Funcionario
from core.models import Servico, Veiculo, TagPeca  # Ajuste de import conforme nova estrutura
from operacao.models import OrdemServico, MidiaOrdemServico  # IncidenteOS não existe ainda

class EstabelecimentoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Estabelecimento
    
    nome_fantasia = factory.Sequence(lambda n: f'Lava Jato {n}')
    cnpj = factory.Sequence(lambda n: f'{n:014d}') # Gera CNPJ único sequencial
    endereco_completo = 'Rua de Teste, 123'
    is_active = True

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
    
    username = factory.Sequence(lambda n: f'operador_{n}')
    name = factory.Faker('name')
    email = factory.LazyAttribute(lambda o: f'{o.username}@lava.me')
    password = factory.PostGenerationMethodCall('set_password', 'senha12345')
    
    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Override para criar perfil Funcionario automaticamente"""
        # Extrair dados do perfil
        estabelecimento = kwargs.pop('estabelecimento', None)
        cargo = kwargs.pop('cargo', CargoChoices.LAVADOR)
        
        # Criar usuário
        user = super()._create(model_class, *args, **kwargs)
        
        # Criar perfil funcionário se estabelecimento foi fornecido
        if estabelecimento:
            Funcionario.objects.create(
                user=user,
                estabelecimento=estabelecimento,
                cargo=cargo
            )
        
        return user

class ServicoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Servico
    
    estabelecimento = factory.SubFactory(EstabelecimentoFactory)
    nome = 'Lavagem Industrial'
    preco = 50.00
    duracao_estimada_minutos = 30 # Campo atualizado conforme modelo core.models.Servico
    is_active = True

class VeiculoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Veiculo
    
    estabelecimento = factory.SubFactory(EstabelecimentoFactory)
    placa = factory.Sequence(lambda n: f'AAA0{n:02d}') # Garante placa válida no formato
    modelo = 'Gol'
    marca = 'VW'
    cor = 'Branco'

class OrdemServicoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = OrdemServico
    
    estabelecimento = factory.SubFactory(EstabelecimentoFactory)
    veiculo = factory.SubFactory(VeiculoFactory, estabelecimento=factory.SelfAttribute('..estabelecimento'))
    servico = factory.SubFactory(ServicoFactory, estabelecimento=factory.SelfAttribute('..estabelecimento'))
    funcionario = factory.SubFactory(UserFactory, estabelecimento=factory.SelfAttribute('..estabelecimento'))
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

# IncidenteOSFactory removido pois o modelo IncidenteOS não existe ainda em operacao.models