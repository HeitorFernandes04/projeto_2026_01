from rest_framework import serializers
from .models import Atendimento, MidiaAtendimento, Servico, Veiculo
import os

class ServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servico
        fields = ['id', 'nome', 'preco', 'duracao_estimada_min']


class VeiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Veiculo
        fields = ['id', 'placa', 'modelo', 'marca', 'cor', 'nome_dono', 'celular_dono']


class AtendimentoSerializer(serializers.ModelSerializer):
    veiculo = VeiculoSerializer(read_only=True)
    servico = ServicoSerializer(read_only=True)
    midias = serializers.SerializerMethodField()

    class Meta:
        model = Atendimento
        fields = ['id', 'veiculo', 'servico', 'data_hora', 'horario_inicio', 'status', 'observacoes', 'midias']

    def get_midias(self, obj):
        # Importação local para contornar dependência circular de declaração.
        from .serializers import MidiaAtendimentoSerializer
        
        request = self.context.get('request')
        midias = obj.midias.all()
        return MidiaAtendimentoSerializer(midias, many=True, context={'request': request}).data


# ---------------------------------------------------------------------------
#  RF-04 — Criar atendimento
# ---------------------------------------------------------------------------

class CriarAtendimentoSerializer(serializers.Serializer):
    """Serializer de ENTRADA para criar um atendimento com veículo embutido."""
    nome_dono   = serializers.CharField()
    celular_dono = serializers.CharField(required=False, allow_blank=True, default='')
    placa       = serializers.CharField()
    modelo      = serializers.CharField()
    marca       = serializers.CharField()
    cor         = serializers.CharField(required=False, allow_blank=True, default='')
    servico_id  = serializers.IntegerField()
    data_hora   = serializers.DateTimeField()
    observacoes = serializers.CharField(required=False, allow_blank=True, default='')
    iniciar_agora = serializers.BooleanField(required=False, default=False)


# ---------------------------------------------------------------------------
#  RF-05/06 — Upload de fotos (antes e depois)
# ---------------------------------------------------------------------------

EXTENSOES_PERMITIDAS = {'.jpg', '.jpeg', '.png', '.webp'}


def validar_extensao_imagem(arquivo):
    """Valida que o arquivo possui uma extensão de imagem permitida."""

    ext = os.path.splitext(arquivo.name)[1].lower()
    if ext not in EXTENSOES_PERMITIDAS:
        raise serializers.ValidationError(
            f'Extensão "{ext}" não permitida. '
            f'Extensões aceitas: {", ".join(sorted(EXTENSOES_PERMITIDAS))}.'
        )


class MidiaAtendimentoUploadSerializer(serializers.Serializer):
    """Serializer de ENTRADA para upload de múltiplas fotos."""

    momento = serializers.ChoiceField(choices=['ANTES', 'DEPOIS'])
    arquivos = serializers.ListField(
        child=serializers.ImageField(validators=[validar_extensao_imagem]),
        allow_empty=False,
        max_length=5,
        help_text='Lista de imagens para upload (máximo 5).',
    )


class MidiaAtendimentoSerializer(serializers.ModelSerializer):
    """Serializer de SAÍDA — devolve URL absoluta do arquivo."""

    arquivo = serializers.SerializerMethodField()

    class Meta:
        model = MidiaAtendimento
        fields = ['id', 'atendimento', 'arquivo', 'momento', 'enviado_em']

    def get_arquivo(self, obj):
        request = self.context.get('request')
        if request and obj.arquivo:
            return request.build_absolute_uri(obj.arquivo.url)
        return None


class HistoricoAtendimentoFiltroSerializer(serializers.Serializer):
    """Serializer de entrada para filtro de histÃ³rico por perÃ­odo."""

    data_inicial = serializers.DateField()
    data_final = serializers.DateField()
    status = serializers.ChoiceField(
        choices=['todos', *[status for status, _ in Atendimento.STATUS_CHOICES]],
        required=False,
        default='todos',
    )

class AtualizarComentarioSerializer(serializers.ModelSerializer):
    """Serializer para a RF-07 — Apenas o campo de observações."""
    class Meta:
        model = Atendimento
        fields = ['observacoes']
