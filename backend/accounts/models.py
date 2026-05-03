import os
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.text import slugify
from django.dispatch import receiver
from django.db.models.signals import pre_save, post_delete


class Estabelecimento(models.Model):
    nome_fantasia = models.CharField(max_length=150)
    cnpj = models.CharField(max_length=14, unique=True)
    endereco_completo = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    # RF-21: Identificador público amigável para URL.
    slug = models.SlugField(max_length=150, unique=True, null=True, blank=True)
    # Identidade visual do estabelecimento (Upload de arquivo)
    logo = models.ImageField(upload_to='logos/', null=True, blank=True)

    # RF-22/RF-29: Horários de funcionamento para motor de disponibilidade
    horario_abertura = models.TimeField(default="08:00")
    horario_fechamento = models.TimeField(default="18:00")

    class Meta:
        verbose_name = "Estabelecimento"
        verbose_name_plural = "Estabelecimentos"

    def __str__(self):
        return self.nome_fantasia

    def _gerar_slug_unico(self):
        """Gera um slug único a partir do nome_fantasia.
        Usa uuid4 curto como sufixo em caso de colisão para garantir
        unicidade de forma atômica (sem necessidade de dois saves).
        """
        import uuid
        base = slugify(self.nome_fantasia)
        slug_candidato = base
        qs = Estabelecimento.objects.filter(slug=slug_candidato)
        if self.pk:
            qs = qs.exclude(pk=self.pk)
        if qs.exists():
            sufixo = uuid.uuid4().hex[:6]
            slug_candidato = f"{base}-{sufixo}"
        return slug_candidato

    def save(self, *args, **kwargs):
        """Auto-gera ou atualiza o slug a partir do nome_fantasia."""
        if self.pk:
            old_instance = Estabelecimento.objects.get(pk=self.pk)
            if old_instance.nome_fantasia != self.nome_fantasia:
                self.slug = self._gerar_slug_unico()
        
        if not self.slug:
            self.slug = self._gerar_slug_unico()
            
        super().save(*args, **kwargs)


class User(AbstractUser):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'name']

    @property
    def estabelecimento(self):
        """Resolve o estabelecimento via perfil (gestor ou funcionário)."""
        if hasattr(self, 'perfil_gestor'):
            return self.perfil_gestor.estabelecimento
        if hasattr(self, 'perfil_funcionario'):
            return self.perfil_funcionario.estabelecimento
        return None

    @estabelecimento.setter
    def estabelecimento(self, value):
        # A associação real ocorre via Gestor/Funcionario; setter existe apenas
        # para compatibilidade com código que atribui diretamente à instância.
        pass

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


@receiver(post_delete, sender=Estabelecimento)
def auto_delete_file_on_delete(sender, instance, **kwargs):
    """Deleta o arquivo físico da logo quando o Estabelecimento é removido."""
    if instance.logo:
        if os.path.isfile(instance.logo.path):
            os.remove(instance.logo.path)


@receiver(pre_save, sender=Estabelecimento)
def auto_delete_file_on_change(sender, instance, **kwargs):
    """Deleta o arquivo físico antigo quando a logo é atualizada ou removida."""
    if not instance.pk:
        return False

    try:
        old_file = sender.objects.get(pk=instance.pk).logo
    except sender.DoesNotExist:
        return False

    new_file = instance.logo
    if not old_file == new_file:
        if old_file and os.path.isfile(old_file.path):
            os.remove(old_file.path)