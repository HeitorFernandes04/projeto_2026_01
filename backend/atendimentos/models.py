from django.conf import settings
from django.db import models

class Veiculo(models.Model):
    placa = models.CharField(max_length=10, unique=True)
    modelo = models.CharField(max_length=100)
    marca = models.CharField(max_length=100)
    cor = models.CharField(max_length=50, blank=True, default='')
    nome_dono = models.CharField(max_length=150)
    celular_dono = models.CharField(max_length=20, blank=True, default='')
    ano = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f'{self.marca} {self.modelo} - {self.placa}'

    class Meta:
        verbose_name = 'Veículo'
        verbose_name_plural = 'Veículos'


class Servico(models.Model):
    nome = models.CharField(max_length=100)
    preco = models.DecimalField(max_digits=8, decimal_places=2)
    duracao_estimada_min = models.PositiveIntegerField(help_text='Duração estimada em minutos')

    def __str__(self):
        return self.nome

    class Meta:
        verbose_name = 'Serviço'
        verbose_name_plural = 'Serviços'


class Atendimento(models.Model):
    STATUS_CHOICES = [
        ('agendado', 'Agendado'),
        ('em_andamento', 'Em Andamento'),
        ('finalizado', 'Finalizado'),
        ('cancelado', 'Cancelado'),
    ]

    # ETAPAS para controle interno do progresso (RF-07)
    ETAPA_CHOICES = [
        (1, 'Vistoria'),
        (2, 'Lavagem'),
        (3, 'Acabamento'),
        (4, 'Liberação'),
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
    
    # Campo crucial para o Frontend saber onde o usuário parou
    etapa_atual = models.PositiveSmallIntegerField(choices=ETAPA_CHOICES, default=1)

    # --- Timestamps para métricas e persistência do cronômetro ---
    horario_inicio = models.DateTimeField(null=True, blank=True) # Início da Vistoria
    horario_lavagem = models.DateTimeField(null=True, blank=True) # Quando entrou em lavagem
    horario_acabamento = models.DateTimeField(null=True, blank=True) # Quando entrou em acabamento
    horario_finalizacao = models.DateTimeField(null=True, blank=True) # Fim de tudo

    # --- Campos de dados técnicos ---
    observacoes = models.TextField(blank=True, default='')
    laudo_vistoria = models.TextField(blank=True, default='')
    partes_avaria = models.JSONField(default=list, blank=True)
    
    # Armazena quais itens do checklist de lavagem foram marcados no Front
    checklist_lavagem = models.JSONField(default=list, blank=True, help_text="Lista de itens concluídos na lavagem")
    
    laudo_lavagem = models.TextField(blank=True, default='')
    laudo_acabamento = models.TextField(blank=True, default='')
    vaga_patio = models.CharField(max_length=50, blank=True, default='')
    notas_entrega = models.TextField(blank=True, default='')

    def __str__(self):
        return f'{self.veiculo} - {self.servico} - {self.data_hora:%d/%m/%Y %H:%M}'

    class Meta:
        verbose_name = 'Atendimento'
        verbose_name_plural = 'Atendimentos'
        ordering = ['data_hora']


# No arquivo atendimentos/models.py

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
    # ADICIONE ESTA LINHA ABAIXO:
    parte_nome = models.CharField(max_length=100, blank=True, default='') 
    enviado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Mídia {self.momento} ({self.parte_nome}) - Atendimento #{self.atendimento_id}'
    