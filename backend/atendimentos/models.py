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


class OrdemServico(models.Model):
    STATUS_CHOICES = [
        ('PATIO', 'Pátio (Aguardando)'),
        ('VISTORIA_INICIAL', 'Vistoria Inicial'),
        ('EM_EXECUCAO', 'Em Execução'),
        ('LIBERACAO', 'Liberação'),
        ('FINALIZADO', 'Finalizado'),
        ('BLOQUEADO_INCIDENTE', 'Bloqueado por Incidente'),
        ('CANCELADO', 'Cancelado'),
    ]

    veiculo = models.ForeignKey(Veiculo, on_delete=models.PROTECT, related_name='ordens_servico')
    servico = models.ForeignKey(Servico, on_delete=models.PROTECT, related_name='ordens_servico')
    funcionario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ordens_servico',
    )

    data_hora = models.DateTimeField()
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='PATIO')
    observacoes = models.TextField(blank=True, default='')

    laudo_vistoria = models.TextField(blank=True, null=True)
    comentario_lavagem = models.TextField(blank=True, null=True)
    comentario_acabamento = models.TextField(blank=True, null=True)
    vaga_patio = models.CharField(max_length=50, blank=True, null=True)

    horario_inicio = models.DateTimeField(null=True, blank=True)
    horario_lavagem = models.DateTimeField(null=True, blank=True)
    horario_acabamento = models.DateTimeField(null=True, blank=True)
    horario_finalizacao = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-data_hora']
        verbose_name = 'Ordem de Serviço'
        verbose_name_plural = 'Ordens de Serviço'

    def __str__(self):
        return f"{self.veiculo.placa if self.veiculo else 'S/P'} - {self.status}"


class TagPeca(models.Model):
    """Entidade para popular o grid de seleção rápida no front-end."""
    CATEGORIA_CHOICES = [
        ('frente', 'Frente'),
        ('lateral_esq', 'Lateral Esquerda'),
        ('lateral_dir', 'Lateral Direita'),
        ('traseira', 'Traseira'),
        ('interior', 'Interior'),
    ]
    nome = models.CharField(max_length=100, help_text="Ex: Capô, Porta Dianteira Esq")
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES)

    def __str__(self):
        return f"{self.nome} ({self.get_categoria_display()})"


class IncidenteOS(models.Model):
    """Isola o fluxo de erros e danos causados pela equipe."""
    ordem_servico = models.ForeignKey(
        OrdemServico,
        on_delete=models.CASCADE,
        related_name='incidentes'
    )
    tag_peca = models.ForeignKey(
        TagPeca,
        on_delete=models.PROTECT,
        related_name='incidentes',
        null=True,
        blank=True
    )
    descricao = models.TextField(help_text="Relato detalhado do operador")
    foto_url = models.ImageField(upload_to='incidentes/%Y/%m/%d/', help_text="Evidência do dano")
    resolvido = models.BooleanField(default=False, help_text="Controle para liberação pelo Gestor")
    data_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Incidente OS #{self.ordem_servico_id} - {self.tag_peca}"


class MidiaOrdemServico(models.Model):
    MOMENTO_CHOICES = [
        ('VISTORIA_GERAL', 'Vistoria Geral'),
        ('AVARIA_PREVIA', 'Avaria Prévia'),
        ('EXECUCAO', 'Execução'),
        ('FINALIZADO', 'Finalizado'),
    ]

    ordem_servico = models.ForeignKey(
        OrdemServico,
        on_delete=models.CASCADE,
        related_name='midias',
    )
    arquivo = models.ImageField(upload_to='ordens_servico/%Y/%m/%d/')
    momento = models.CharField(max_length=20, choices=MOMENTO_CHOICES)
    enviado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Mídia {self.momento} - OS #{self.ordem_servico_id}'

    class Meta:
        verbose_name = 'Mídia de OS'
        verbose_name_plural = 'Mídias de OS'
        ordering = ['-enviado_em']