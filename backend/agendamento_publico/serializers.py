from rest_framework import serializers
from accounts.models import Estabelecimento
from core.models import Servico, Veiculo


class ClienteVeiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Veiculo
        fields = ['id', 'placa', 'marca', 'modelo', 'cor']

    def validate_placa(self, value):
        from .services import VeiculoService
        return VeiculoService.validar_placa(value)

    def validate_cor(self, value):
        from .services import VeiculoService
        return VeiculoService.validar_cor(value)



class ClienteAgendamentoSerializer(serializers.Serializer):
    slug = serializers.CharField()
    servico_id = serializers.IntegerField()
    data_hora = serializers.DateTimeField()
    veiculo_id = serializers.IntegerField()


class AuthB2CSetupSerializer(serializers.Serializer):
    telefone = serializers.CharField(max_length=20)
    placa = serializers.CharField(max_length=10)
    pin = serializers.RegexField(
        regex=r'^\d{4}$',
        error_messages={'invalid': 'O PIN deve conter exatamente 4 digitos.'},
    )


class AuthB2CLoginSerializer(serializers.Serializer):
    telefone = serializers.CharField(max_length=20)
    pin = serializers.RegexField(
        regex=r'^\d{4}$',
        error_messages={'invalid': 'O PIN deve conter exatamente 4 digitos.'},
    )


class AuthB2CWhatsAppSerializer(serializers.Serializer):
    telefone = serializers.CharField(max_length=20)
    nome = serializers.CharField(max_length=100, required=False, allow_blank=True)


class AuthB2CVerificacaoSerializer(serializers.Serializer):
    telefone = serializers.CharField(max_length=20)
    pin = serializers.RegexField(
        regex=r'^\d{4}$',
        error_messages={'invalid': 'O PIN deve conter exatamente 4 digitos.'},
    )


class ServicoPublicoSerializer(serializers.ModelSerializer):
    """
    Exposição segura de serviços: apenas campos necessários para o portal B2C.
    Campos sensíveis (custo, markup, etc.) são omitidos por design.
    """
    duracao_estimada_min = serializers.IntegerField(source='duracao_estimada_minutos')

    class Meta:
        model = Servico
        fields = ['id', 'nome', 'preco', 'duracao_estimada_min']


class EstabelecimentoPublicoSerializer(serializers.ModelSerializer):
    """
    Exposição pública e segura do Estabelecimento para o Portal de Autoagendamento.
    CA-03: cnpj, faturamento e dados do gestor são omitidos por design (não incluídos em fields).
    CA-02: servicos filtrados para is_active=True via ServicoPublicoSerializer.
    """
    servicos = serializers.SerializerMethodField()
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Estabelecimento
        # Expor APENAS nome_fantasia, endereco_completo e servicos ativos.
        # id incluído para uso interno do frontend (sem IDOR pois a busca é via slug).
        fields = ['id', 'nome_fantasia', 'endereco_completo', 'logo_url', 'servicos', 'slug']

    def get_logo_url(self, obj):
        request = self.context.get('request')
        if obj.logo:
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        
        return None

    def get_servicos(self, obj):
        # CA-02 / Cenário 1: filtrar somente serviços ativos do estabelecimento
        servicos_ativos = Servico.objects.filter(
            estabelecimento=obj,
            is_active=True
        )
        return ServicoPublicoSerializer(servicos_ativos, many=True).data


class EstabelecimentoMapaSerializer(serializers.ModelSerializer):
    """
    RF-28: Serializer para o mapa B2C. Expõe apenas os campos necessários
    para renderizar os pins e o Drawer de resumo do estabelecimento.
    """
    logo = serializers.SerializerMethodField()

    class Meta:
        model = Estabelecimento
        fields = ['id', 'nome_fantasia', 'slug', 'latitude', 'longitude', 'logo', 'endereco_completo', 'avaliacao_media']

    def get_logo(self, obj):
        request = self.context.get('request')
        if obj.logo and request:
            return request.build_absolute_uri(obj.logo.url)
        return None


class CancelamentoSerializer(serializers.Serializer):
    """
    RF-24: Serializer de entrada para cancelamento autônomo pelo cliente.
    A identificação da OS é feita via slug na URL (RF-24.3).
    O motivo é opcional (RF-24 §1.5 / RNF-02).
    """
    motivo_cancelamento = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=500,
        default='',
    )
