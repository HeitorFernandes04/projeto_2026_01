"""
Camada de serviço — atendimentos.

Toda lógica de negócio do app fica isolada aqui.
Views delegam para estes métodos; nunca implementam regras diretamente.
"""
from django.core.exceptions import ValidationError

from atendimentos.models import MidiaAtendimento


class MidiaAtendimentoService:
    """Serviço responsável pelo processamento de upload de mídias."""

    # Status que permitem receber novas mídias
    STATUS_PERMITIDOS = {'agendado', 'em_andamento'}

    @staticmethod
    def processar_upload_multiplo(atendimento, momento, arquivos):
        """
        Processa o upload de múltiplos arquivos de mídia para um atendimento.

        Args:
            atendimento: instância de Atendimento
            momento: str — 'ANTES' ou 'DEPOIS'
            arquivos: lista de UploadedFile (imagens)

        Returns:
            list[MidiaAtendimento] — objetos criados

        Raises:
            ValidationError: se o status do atendimento não permitir uploads
        """
        if atendimento.status not in MidiaAtendimentoService.STATUS_PERMITIDOS:
            raise ValidationError(
                f'Não é possível enviar mídias para um atendimento com status '
                f'"{atendimento.get_status_display()}". '
                f'Status permitidos: agendado, em andamento.'
            )

        midias = [
            MidiaAtendimento(
                atendimento=atendimento,
                arquivo=arquivo,
                momento=momento,
            )
            for arquivo in arquivos
        ]

        # bulk_create para eficiência (1 query apenas)
        return MidiaAtendimento.objects.bulk_create(midias)
