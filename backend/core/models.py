from django.db import models
from accounts.models import Estabelecimento

class Servico(models.Model):
    """RF-11: Gestão de Catálogo de Serviços."""
    estabelecimento = models.ForeignKey(Estabelecimento, on_delete=models.CASCADE, related_name='servicos')
    nome = models.CharField(max_length=100)
    preco = models.DecimalField(max_digits=10, decimal_places=2)
    # CA-01: Campo obrigatório conforme documentação
    duracao_estimada_minutos = models.PositiveIntegerField(help_text="Tempo médio em minutos")
    is_active = models.BooleanField(default=True) # Soft Delete (CA-02)

    class Meta:
        db_table = 'core_servico'

    def __str__(self):
        return self.nome
    
    def soft_delete(self):
        """Implementa Soft Delete - marca is_active como False em vez de remover"""
        self.is_active = False
        self.save()

class Veiculo(models.Model):
    """Cadastro base de veículos consumido pela Operação."""
    COR_CHOICES = [
        ('BRANCO', 'Branco'),
        ('PRETO', 'Preto'),
        ('CINZA', 'Cinza'),
        ('PRATA', 'Prata'),
        ('VERMELHO', 'Vermelho'),
        ('AZUL', 'Azul'),
        ('VERDE', 'Verde'),
        ('AMARELO', 'Amarelo'),
        ('OUTRO', 'Outro'),
    ]
    estabelecimento = models.ForeignKey(Estabelecimento, on_delete=models.CASCADE)
    cliente = models.ForeignKey('accounts.Cliente', on_delete=models.SET_NULL, null=True, blank=True, related_name='veiculos')
    placa = models.CharField(max_length=10, unique=True)
    modelo = models.CharField(max_length=50)
    marca = models.CharField(max_length=50)
    cor = models.CharField(max_length=30, choices=COR_CHOICES, default='OUTRO')
    nome_dono = models.CharField(max_length=100, null=True, blank=True)
    celular_dono = models.CharField(max_length=20, null=True, blank=True)

class TagPeca(models.Model):
    """Estrutura para mapeamento de avarias."""
    estabelecimento = models.ForeignKey(Estabelecimento, on_delete=models.CASCADE)
    nome = models.CharField(max_length=50)
    categoria = models.CharField(max_length=50, choices=(('INTERNO', 'Interno'), ('EXTERNO', 'Externo')))

class VistoriaItem(models.Model):
    """Classificação de avarias por peça em uma ordem de serviço."""
    ordem_servico = models.ForeignKey('operacao.OrdemServico', on_delete=models.CASCADE, related_name='vistoria_items')
    tag_peca = models.ForeignKey(TagPeca, on_delete=models.CASCADE)
    possui_avaria = models.BooleanField(default=False)
    foto_url = models.ImageField(upload_to='vistoria/', null=True, blank=True)
    
    class Meta:
        unique_together = ['ordem_servico', 'tag_peca']
    
    def __str__(self):
        return f"{self.ordem_servico.id} - {self.tag_peca.nome}"