"""
Camada de serviço — atendimentos.

Toda lógica de negócio do app fica isolada aqui.
Views delegam para estes métodos; nunca implementam regras diretamente.
"""
from io import BytesIO

from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile
from PIL import Image

from django.shortcuts import get_object_or_404

from atendimentos.models import Atendimento, MidiaAtendimento, Servico, Veiculo

# Constantes de negócio
MAX_FOTOS_POR_MOMENTO = 5
MAX_DIMENSAO_PX = 1920
QUALIDADE_JPEG = 85


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
            ValidationError: se o limite de 5 fotos por momento for excedido
        """
        if atendimento.status not in MidiaAtendimentoService.STATUS_PERMITIDOS:
            raise ValidationError(
                f'Não é possível enviar mídias para um atendimento com status '
                f'"{atendimento.get_status_display()}". '
                f'Status permitidos: agendado, em andamento.'
            )

        # Validação de limite de fotos por momento (RF-05/RF-06)
        fotos_existentes = MidiaAtendimento.objects.filter(
            atendimento=atendimento,
            momento=momento,
        ).count()

        total_apos_upload = fotos_existentes + len(arquivos)

        if total_apos_upload > MAX_FOTOS_POR_MOMENTO:
            vagas = MAX_FOTOS_POR_MOMENTO - fotos_existentes
            raise ValidationError(
                f'Limite de {MAX_FOTOS_POR_MOMENTO} fotos por momento atingido. '
                f'Já existem {fotos_existentes} foto(s) "{momento}". '
                f'Você pode enviar no máximo mais {max(vagas, 0)}.'
            )

        # Compressão e normalização via Pillow
        arquivos_processados = [
            MidiaAtendimentoService._comprimir_imagem(arq)
            for arq in arquivos
        ]

        midias = [
            MidiaAtendimento(
                atendimento=atendimento,
                arquivo=arquivo,
                momento=momento,
            )
            for arquivo in arquivos_processados
        ]

        # bulk_create para eficiência (1 query apenas)
        return MidiaAtendimento.objects.bulk_create(midias)

    @staticmethod
    def _comprimir_imagem(arquivo):
        """
        Abre a imagem com Pillow, redimensiona se necessário (max 1920px)
        e salva com quality=85 em JPEG. Retorna um InMemoryUploadedFile.

        Imagens menores que o limite não sofrem upscale.
        """
        img = Image.open(arquivo)

        # Converte RGBA/P para RGB (JPEG não suporta transparência)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')

        # Redimensiona apenas se exceder o limite (sem upscale)
        if img.width > MAX_DIMENSAO_PX or img.height > MAX_DIMENSAO_PX:
            img.thumbnail((MAX_DIMENSAO_PX, MAX_DIMENSAO_PX), Image.LANCZOS)

        # Salva em buffer JPEG com qualidade controlada
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=QUALIDADE_JPEG, optimize=True)
        buffer.seek(0)

        # Determina o nome do arquivo de saída
        nome_original = getattr(arquivo, 'name', 'foto.jpg')
        nome_base = nome_original.rsplit('.', 1)[0]
        nome_saida = f'{nome_base}.jpg'

        return InMemoryUploadedFile(
            file=buffer,
            field_name='arquivo',
            name=nome_saida,
            content_type='image/jpeg',
            size=buffer.getbuffer().nbytes,
            charset=None,
        )


class AtendimentoService:
    """Serviço responsável pelas operações de criação de atendimentos."""

    @staticmethod
    def criar_com_veiculo(dados, funcionario):
        """
        Cria (ou reutiliza) um veículo pela placa e registra um novo atendimento.

        Args:
            dados: dict com os campos validados pelo CriarAtendimentoSerializer.
            funcionario: instância de User (quem está criando o atendimento).

        Returns:
            Atendimento — instância criada.

        Raises:
            Http404: se o servico_id não corresponder a nenhum Servico.
        """
        servico = get_object_or_404(Servico, pk=dados['servico_id'])

        veiculo, _ = Veiculo.objects.update_or_create(
            placa=dados['placa'],
            defaults={
                'modelo':      dados['modelo'],
                'marca':       dados['marca'],
                'cor':         dados['cor'],
                'nome_dono':   dados['nome_dono'],
                'celular_dono': dados['celular_dono'],
            },
        )

        return Atendimento.objects.create(
            veiculo=veiculo,
            servico=servico,
            funcionario=funcionario,
            data_hora=dados['data_hora'],
            observacoes=dados['observacoes'],
        )
