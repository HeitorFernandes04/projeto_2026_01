from rest_framework import serializers
from accounts.models import Estabelecimento
from core.models import Servico


class ServicoPublicoSerializer(serializers.ModelSerializer):
    """
    Exposição segura de serviços: apenas campos necessários para o portal B2C.
    Campos sensíveis (custo, markup, etc.) são omitidos por design.
    """

    class Meta:
        model = Servico
        # CA-02: Expor estritamente id, nome, preco e duracao_estimada_minutos
        fields = ['id', 'nome', 'preco', 'duracao_estimada_minutos']


class EstabelecimentoPublicoSerializer(serializers.ModelSerializer):
    """
    Exposição pública e segura do Estabelecimento para o Portal de Autoagendamento.
    CA-03: cnpj, faturamento e dados do gestor são omitidos por design (não incluídos em fields).
    CA-02: servicos filtrados para is_active=True via ServicoPublicoSerializer.
    """
    servicos = serializers.SerializerMethodField()

    class Meta:
        model = Estabelecimento
        # Expor APENAS nome_fantasia, endereco_completo e servicos ativos.
        # id incluído para uso interno do frontend (sem IDOR pois a busca é via slug).
        fields = ['id', 'nome_fantasia', 'endereco_completo', 'logo_url', 'servicos']

    def get_servicos(self, obj):
        # CA-02 / Cenário 1: filtrar somente serviços ativos do estabelecimento
        servicos_ativos = Servico.objects.filter(
            estabelecimento=obj,
            is_active=True
        )
        return ServicoPublicoSerializer(servicos_ativos, many=True).data
