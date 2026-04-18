from django.contrib.auth.models import AbstractUser
from django.db import models


class Estabelecimento(models.Model):
    nome_fantasia = models.CharField(max_length=150)
    cnpj = models.CharField(max_length=14, unique=True)
    endereco_completo = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Estabelecimento"
        verbose_name_plural = "Estabelecimentos"

    def __str__(self):
        return self.nome_fantasia


class User(AbstractUser):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'name']

    def __str__(self):
        return self.email


class CargoChoices(models.TextChoices):
    GESTOR = 'GESTOR', 'Gestor'
    LAVADOR = 'LAVADOR', 'Lavador'
    DETALHISTA = 'DETALHISTA', 'Detalhista'


class Cliente(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='perfil_cliente'
    )
    telefone_whatsapp = models.CharField(max_length=20, blank=True, null=True)
    endereco_padrao = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"

    def __str__(self):
        return f"Cliente: {self.user.email}"


class Funcionario(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='perfil_funcionario'
    )
    estabelecimento = models.ForeignKey(
        Estabelecimento,
        on_delete=models.PROTECT,
        related_name='funcionarios'
    )
    cargo = models.CharField(
        max_length=20,
        choices=CargoChoices.choices,
        default=CargoChoices.LAVADOR
    )

    class Meta:
        verbose_name = "Funcionário"
        verbose_name_plural = "Funcionários"

    def __str__(self):
        return f"{self.user.email} - {self.get_cargo_display()} @ {self.estabelecimento.nome_fantasia}"


class Gestor(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='perfil_gestor'
    )
    estabelecimento = models.ForeignKey(
        Estabelecimento,
        on_delete=models.PROTECT,
        related_name='gestores'
    )

    class Meta:
        verbose_name = "Gestor"
        verbose_name_plural = "Gestores"

    def __str__(self):
        return f"Gestor: {self.user.email} @ {self.estabelecimento.nome_fantasia}"