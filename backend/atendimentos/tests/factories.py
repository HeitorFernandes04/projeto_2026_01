"""
Factories para geração de dados de teste — app atendimentos.

Utiliza factory_boy para criar instâncias de modelo de forma
declarativa, evitando repetição de setUp manual nos testes.
"""
from io import BytesIO

import factory
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from PIL import Image

from accounts.models import User
from atendimentos.models import Atendimento, MidiaAtendimento, Servico, Veiculo


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f'usuario_{n}')
    email = factory.LazyAttribute(lambda o: f'{o.username}@lava.me')
    password = factory.PostGenerationMethodCall('set_password', 'senha12345')
    name = factory.Faker('name', locale='pt_BR')


class ServicoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Servico

    nome = factory.Faker('word', locale='pt_BR')
    preco = factory.Faker('pydecimal', left_digits=3, right_digits=2, positive=True)
    duracao_estimada_min = factory.Faker('random_int', min=15, max=120)


class VeiculoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Veiculo

    placa = factory.Sequence(lambda n: f'ABC{n:01d}D{n:02d}')
    modelo = factory.Faker('word', locale='pt_BR')
    marca = factory.Faker('company', locale='pt_BR')
    nome_dono = factory.Faker('name', locale='pt_BR')


class AtendimentoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Atendimento

    veiculo = factory.SubFactory(VeiculoFactory)
    servico = factory.SubFactory(ServicoFactory)
    funcionario = factory.SubFactory(UserFactory)
    data_hora = factory.LazyFunction(timezone.now)
    status = 'agendado'


def criar_imagem_fake(nome='foto.jpg'):
    """Gera um SimpleUploadedFile com uma imagem JPEG válida de 10x10."""
    buffer = BytesIO()
    Image.new('RGB', (10, 10), color='red').save(buffer, format='JPEG')
    buffer.seek(0)
    return SimpleUploadedFile(nome, buffer.read(), content_type='image/jpeg')


def criar_imagem_fake_buffer(nome='foto.jpg'):
    """Gera um BytesIO (para multipart upload em testes de API)."""
    buffer = BytesIO()
    Image.new('RGB', (10, 10), color='blue').save(buffer, format='JPEG')
    buffer.seek(0)
    buffer.name = nome
    return buffer


def criar_imagem_fake_grande(nome='grande.jpg', largura=4000, altura=3000):
    """Gera um SimpleUploadedFile com uma imagem JPEG grande para testar compressão."""
    buffer = BytesIO()
    Image.new('RGB', (largura, altura), color='green').save(buffer, format='JPEG')
    buffer.seek(0)
    return SimpleUploadedFile(nome, buffer.read(), content_type='image/jpeg')
