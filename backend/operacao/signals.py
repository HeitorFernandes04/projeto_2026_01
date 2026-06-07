from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Avg
from .models import OrdemServico

@receiver(post_save, sender=OrdemServico)
def atualizar_avaliacao_estabelecimento(sender, instance, **kwargs):
    """
    Sempre que uma Ordem de Serviço com avaliação for salva (ou alterada),
    recalcula a média de avaliações do Estabelecimento associado e atualiza o cache no modelo.
    """
    if instance.status == 'FINALIZADO' and instance.avaliacao_estrelas is not None:
        estabelecimento = instance.estabelecimento
        
        # Calcula a média das OS finalizadas com avaliação
        resultado = OrdemServico.objects.filter(
            estabelecimento=estabelecimento,
            status='FINALIZADO',
            avaliacao_estrelas__isnull=False
        ).aggregate(media=Avg('avaliacao_estrelas'))
        
        media = resultado.get('media')
        if media is not None:
            # Atualiza apenas o campo avaliacao_media para evitar loops
            estabelecimento.avaliacao_media = round(media, 2)
            estabelecimento.save(update_fields=['avaliacao_media'])
