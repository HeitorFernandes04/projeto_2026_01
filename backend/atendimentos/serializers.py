from rest_framework import serializers
from .models import Atendimento, MidiaAtendimento, Servico, Veiculo


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

    class Meta:
        model = Atendimento
        fields = ['id', 'veiculo', 'servico', 'data_hora', 'horario_inicio', 'status', 'observacoes']


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


# ---------------------------------------------------------------------------
#  RF-05 — Upload de fotos
# ---------------------------------------------------------------------------

class MidiaAtendimentoUploadSerializer(serializers.Serializer):
    """Serializer de ENTRADA para upload de múltiplas fotos."""

    momento = serializers.ChoiceField(choices=['ANTES', 'DEPOIS'])
    arquivos = serializers.ListField(
        child=serializers.ImageField(),
        allow_empty=False,
        help_text='Lista de imagens para upload.',
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

