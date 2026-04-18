from rest_framework import serializers
from .models import Servico, Veiculo, TagPeca

class VeiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Veiculo
        fields = '__all__'

class ServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servico
        # RF-11: Exposição dos campos para o Gestor
        fields = ['id', 'nome', 'preco', 'duracao_estimada_minutos', 'is_active', 'estabelecimento']
        read_only_fields = ['estabelecimento']


class TagPecaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TagPeca
        fields = ['id', 'nome', 'categoria', 'estabelecimento']
        read_only_fields = ['estabelecimento']