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
    # Expansão dos estados conforme Documentação Técnica [cite: 50]
    STATUS_CHOICES = [
        ('agendado', 'Agendado'),
        ('em_andamento', 'Em Andamento'),
        ('finalizado', 'Finalizado'),
        ('cancelado', 'Cancelado'),
        ('incidente', 'Incidente/Bloqueado'), # Novo estado para travar a esteira [cite: 50, 63]
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

    def __str__(self):
        return f"{self.veiculo.placa if self.veiculo else 'S/P'} - {self.status}"


class TagPeca(models.Model):
    """Entidade para popular o grid de seleção rápida no front-end[cite: 60]."""
    CATEGORIA_CHOICES = [
        ('frente', 'Frente'),
        ('lateral_esq', 'Lateral Esquerda'),
        ('lateral_dir', 'Lateral Direita'),
        ('traseira', 'Traseira'),
        ('interior', 'Interior'),
    ]
    nome = models.CharField(max_length=100, help_text="Ex: Capô, Porta Dianteira Esq [cite: 60]")
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES)

    def __str__(self):
        return f"{self.nome} ({self.get_categoria_display()})"


class IncidenteOS(models.Model):
    """Isola o fluxo de erros e danos causados pela equipa[cite: 63]."""
    atendimento = models.ForeignKey(
        Atendimento, 
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
    descricao = models.TextField(help_text="Relato detalhado do operador [cite: 63]")
    foto_url = models.ImageField(upload_to='incidentes/%Y/%m/%d/', help_text="Evidência do dano causado [cite: 63]")
    resolvido = models.BooleanField(default=False, help_text="Controle para liberação pelo Gestor [cite: 63]")
    data_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Incidente OS #{self.atendimento_id} - {self.tag_peca}"


class MidiaAtendimento(models.Model):
    # Categorização expandida conforme Documentação Técnica [cite: 57, 58]
    MOMENTO_CHOICES = [
        ('VISTORIA_GERAL', 'Vistoria Geral'),
        ('AVARIA_PREVIA', 'Avaria Prévia'),
        ('EXECUCAO', 'Execução'),
        ('FINALIZADO', 'Finalizado'),
    ]

    atendimento = models.ForeignKey(
        Atendimento,
        on_delete=models.CASCADE,
        related_name='midias',
    )
    arquivo = models.ImageField(upload_to='atendimentos/%Y/%m/%d/')
    momento = models.CharField(max_length=20, choices=MOMENTO_CHOICES)
    enviado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Mídia {self.momento} - Atendimento #{self.atendimento_id}'

    class Meta:
        verbose_name = 'Mídia de Atendimento'
        verbose_name_plural = 'Mídias de Atendimento'
        ordering = ['-enviado_em']