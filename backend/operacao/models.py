from django.db import models
from django.conf import settings
from core.models import Servico, Veiculo, TagPeca # IMPORTANDO DO CORE
from accounts.models import Estabelecimento

class OrdemServico(models.Model):
    STATUS_CHOICES = [
        ('PATIO', 'Pátio'),
        ('VISTORIA_INICIAL', 'Vistoria Inicial'),
        ('EM_EXECUCAO', 'Em Execução'),
        ('LIBERACAO', 'Liberação'),
        ('FINALIZADO', 'Finalizado'),
        ('BLOQUEADO_INCIDENTE', 'Bloqueado por Incidente'),
        ('CANCELADO', 'Cancelado'),
    ]
    
    estabelecimento = models.ForeignKey(Estabelecimento, on_delete=models.PROTECT)
    veiculo = models.ForeignKey(Veiculo, on_delete=models.PROTECT)
    servico = models.ForeignKey(Servico, on_delete=models.PROTECT)
    funcionario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='PATIO')
    data_hora = models.DateTimeField(auto_now_add=True)
    
    # Campos adicionais para controle do fluxo industrial
    laudo_vistoria = models.TextField(blank=True, null=True)
    horario_lavagem = models.DateTimeField(null=True, blank=True)
    horario_acabamento = models.DateTimeField(null=True, blank=True)
    comentario_lavagem = models.TextField(blank=True, null=True)
    comentario_acabamento = models.TextField(blank=True, null=True)
    vaga_patio = models.CharField(max_length=20, blank=True, null=True)
    horario_finalizacao = models.DateTimeField(null=True, blank=True)
    observacoes = models.TextField(blank=True, null=True)

class MidiaOrdemServico(models.Model):
    ordem_servico = models.ForeignKey(OrdemServico, on_delete=models.CASCADE, related_name='midias')
    arquivo = models.ImageField(upload_to='os/')
    momento = models.CharField(max_length=20)
    
class IncidenteOS(models.Model):
    """Registro de incidentes operacionais que bloqueiam a OS."""
    ordem_servico = models.ForeignKey(OrdemServico, on_delete=models.CASCADE, related_name='incidentes')
    tag_peca = models.ForeignKey(TagPeca, on_delete=models.CASCADE)
    descricao = models.TextField()
    foto_url = models.ImageField(upload_to='incidentes/')
    resolvido = models.BooleanField(default=False)
    data_registro = models.DateTimeField(auto_now_add=True)
    data_resolucao = models.DateTimeField(null=True, blank=True)
    observacoes_resolucao = models.TextField(blank=True, null=True)