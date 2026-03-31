from django.conf import settings
from django.db import models


class Servico(models.Model):
    nome = models.CharField(max_length=100)
    preco = models.DecimalField(max_digits=8, decimal_places=2)
    duracao_estimada_min = models.PositiveIntegerField(help_text='Duração estimada em minutos')

    def __str__(self):
        return self.nome

    class Meta:
        verbose_name = 'Serviço'
        verbose_name_plural = 'Serviços'


class Veiculo(models.Model):
    placa = models.CharField(max_length=10, unique=True)
    modelo = models.CharField(max_length=100)
    marca = models.CharField(max_length=100)
    cor = models.CharField(max_length=50, blank=True, default='')
    nome_dono = models.CharField(max_length=150)
    celular_dono = models.CharField(max_length=20, blank=True, default='')

    def __str__(self):
        return f'{self.marca} {self.modelo} {self.cor} - {self.placa}'

    class Meta:
        verbose_name = 'Veículo'
        verbose_name_plural = 'Veículos'


class Atendimento(models.Model):
    STATUS_CHOICES = [
        ('agendado', 'Agendado'),
        ('em_andamento', 'Em Andamento'),
        ('finalizado', 'Finalizado'),
        ('cancelado', 'Cancelado'),
    ]

    veiculo = models.ForeignKey(Veiculo, on_delete=models.PROTECT, related_name='atendimentos')
    servico = models.ForeignKey(Servico, on_delete=models.PROTECT, related_name='atendimentos')
    funcionario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='atendimentos',
    )
    data_hora = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='agendado')
    observacoes = models.TextField(blank=True, default='')

    def __str__(self):
        return f'{self.veiculo} - {self.servico} - {self.data_hora:%d/%m/%Y %H:%M}'

    class Meta:
        verbose_name = 'Atendimento'
        verbose_name_plural = 'Atendimentos'
        ordering = ['data_hora']


class MidiaAtendimento(models.Model):
    MOMENTO_CHOICES = [
        ('ANTES', 'Antes'),
        ('DEPOIS', 'Depois'),
    ]

    atendimento = models.ForeignKey(
        Atendimento,
        on_delete=models.CASCADE,
        related_name='midias',
    )
    arquivo = models.ImageField(upload_to='atendimentos/%Y/%m/%d/')
    momento = models.CharField(max_length=10, choices=MOMENTO_CHOICES)
    enviado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Mídia {self.momento} - Atendimento #{self.atendimento_id}'

    class Meta:
        verbose_name = 'Mídia de Atendimento'
        verbose_name_plural = 'Mídias de Atendimento'
        ordering = ['-enviado_em']
