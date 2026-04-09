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
        ('vistoria', 'Vistoria'),
        ('agendado', 'Agendado'),
        ('em_andamento', 'Em Andamento'),
        ('em_lavagem', 'Em Lavagem'),       
        ('em_acabamento', 'Em Acabamento'),
        ('pendente_gestao', 'Pendente Gestão'),
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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='vistoria')
    
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
    parte_nome = models.CharField(max_length=100, blank=True, default='')
    enviado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Mídia {self.momento} ({self.parte_nome}) - Atendimento #{self.atendimento_id}'

    class Meta:
        verbose_name = 'Mídia de Atendimento'
        verbose_name_plural = 'Mídias de Atendimento'
        ordering = ['-enviado_em']


class OrdemServico(models.Model):
    STATUS_CHOICES = [
        ('aberta', 'Aberta'),
        ('execucao', 'Em Execução'),
        ('finalizada', 'Finalizada'),
        ('cancelada', 'Cancelada'),
    ]
    
    atendimento = models.ForeignKey(
        Atendimento, 
        on_delete=models.PROTECT, 
        related_name='ordens_servico'
    )
    funcionario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='ordens_servico'
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='aberta'
    )
    descricao = models.TextField(blank=True, default='')
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_finalizacao = models.DateTimeField(null=True, blank=True)
    custo_total = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0
    )

    def __str__(self):
        return f'OS #{self.id} - {self.atendimento.veiculo.placa}'

    def atualizar_custo_total(self):
        """Atualiza o custo total somando todos os materiais"""
        total = self.materiais.aggregate(
            total=models.Sum('custo_total')
        )['total'] or 0
        self.custo_total = total
        self.save(update_fields=['custo_total'])

    def pode_finalizar(self):
        """Verifica se a OS pode ser finalizada"""
        return all(etapa.concluida for etapa in self.etapas.all())

    class Meta:
        verbose_name = 'Ordem de Serviço'
        verbose_name_plural = 'Ordens de Serviço'
        ordering = ['-data_criacao']


class EtapaOS(models.Model):
    ordem_servico = models.ForeignKey(
        OrdemServico, 
        on_delete=models.CASCADE, 
        related_name='etapas'
    )
    nome = models.CharField(max_length=100)
    concluida = models.BooleanField(default=False)
    tempo_estimado = models.TimeField()  # HH:MM:SS
    ordem = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f'{self.nome} - OS #{self.ordem_servico_id}'

    class Meta:
        verbose_name = 'Etapa da OS'
        verbose_name_plural = 'Etapas da OS'
        ordering = ['ordem']


class MaterialOS(models.Model):
    ordem_servico = models.ForeignKey(
        OrdemServico, 
        on_delete=models.CASCADE, 
        related_name='materiais'
    )
    nome = models.CharField(max_length=100)
    quantidade = models.DecimalField(max_digits=8, decimal_places=2)
    unidade = models.CharField(max_length=20)  # ex: 'L', 'kg', 'un'
    custo_unitario = models.DecimalField(max_digits=8, decimal_places=2)
    custo_total = models.DecimalField(max_digits=8, decimal_places=2)

    def save(self, *args, **kwargs):
        # Calcula custo total automaticamente
        self.custo_total = self.quantidade * self.custo_unitario
        super().save(*args, **kwargs)
        
        # Atualiza custo total da OS
        self.ordem_servico.atualizar_custo_total()

    def __str__(self):
        return f'{self.nome} ({self.quantidade} {self.unidade}) - OS #{self.ordem_servico_id}'

    class Meta:
        verbose_name = 'Material da OS'
        verbose_name_plural = 'Materiais da OS'
        ordering = ['nome']
