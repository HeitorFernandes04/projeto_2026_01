from rest_framework import serializers
from .models import Atendimento, Servico, Veiculo


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
        fields = ['id', 'veiculo', 'servico', 'data_hora', 'status', 'observacoes']
