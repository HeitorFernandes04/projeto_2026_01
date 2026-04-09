from rest_framework import serializers
from .models import Atendimento, MidiaAtendimento, Servico, Veiculo, OrdemServico, EtapaOS, MaterialOS
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
        fields = [
            'id', 'veiculo', 'servico', 'data_hora', 'status', 'etapa_atual',
            'horario_inicio', 'horario_lavagem', 'horario_acabamento', 'horario_finalizacao',
            'observacoes', 'midias', 'laudo_vistoria', 'partes_avaria'
        ]

    def get_midias(self, obj):
        from .serializers import MidiaAtendimentoSerializer
        request = self.context.get('request')
        midias = obj.midias.all()
        return MidiaAtendimentoSerializer(midias, many=True, context={'request': request}).data

class AtualizarProgressoSerializer(serializers.ModelSerializer):
    """
    Serializer central para a Máquina de Estados.
    O Frontend enviará apenas os campos da etapa atual.
    """
    class Meta:
        model = Atendimento
        fields = [
            'status', 'etapa_atual', 'laudo_vistoria', 'partes_avaria'
        ]


# ---------------------------------------------------------------------------
#  RF-04 — Criar atendimento
# ---------------------------------------------------------------------------

class CriarAtendimentoSerializer(serializers.Serializer):
    """Serializer de ENTRADA para criar um atendimento com veículo embutido."""
    nome_dono   = serializers.CharField(required=True)
    celular_dono = serializers.CharField(required=False, allow_blank=True, default='')
    placa       = serializers.CharField(required=True)
    modelo      = serializers.CharField(required=True)
    marca       = serializers.CharField(required=True)
    cor         = serializers.CharField(required=False, allow_blank=True, default='')
    servico_id = serializers.PrimaryKeyRelatedField(queryset=Servico.objects.all(), source='servico')
    data_hora   = serializers.DateTimeField(required=True)
    observacoes = serializers.CharField(required=False, allow_blank=True, default='')
    iniciar_agora = serializers.BooleanField(required=False, default=False)

    def validate_nome_dono(self, value):
        """Valida que nome_dono não está vazio."""
        if not value or not value.strip():
            raise serializers.ValidationError("Nome do proprietário é obrigatório.")
        return value.strip()

    def validate_placa(self, value):
        """Valida que placa não está vazia."""
        if not value or not value.strip():
            raise serializers.ValidationError("Placa é obrigatória.")
        return value.strip()

    def validate_modelo(self, value):
        """Valida que modelo não está vazio."""
        if not value or not value.strip():
            raise serializers.ValidationError("Modelo é obrigatório.")
        return value.strip()


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


# ---------------------------------------------------------------------------
# Serializers para Ordem de Serviço
# ---------------------------------------------------------------------------

class EtapaOSSerializer(serializers.ModelSerializer):
    class Meta:
        model = EtapaOS
        fields = ['id', 'nome', 'concluida', 'tempo_estimado', 'ordem']


class MaterialOSSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialOS
        fields = ['id', 'nome', 'quantidade', 'unidade', 'custo_unitario', 'custo_total']

    def validate(self, data):
        """Valida que quantidade e custo_unitario são positivos"""
        if data.get('quantidade', 0) <= 0:
            raise serializers.ValidationError("Quantidade deve ser maior que zero")
        if data.get('custo_unitario', 0) <= 0:
            raise serializers.ValidationError("Custo unitário deve ser maior que zero")
        return data


class OrdemServicoSerializer(serializers.ModelSerializer):
    """Serializer de SAÍDA para Ordem de Serviço"""
    atendimento = AtendimentoSerializer(read_only=True)
    etapas = EtapaOSSerializer(many=True, read_only=True)
    materiais = MaterialOSSerializer(many=True, read_only=True)
    funcionario_nome = serializers.SerializerMethodField()

    class Meta:
        model = OrdemServico
        fields = [
            'id', 'atendimento', 'funcionario', 'funcionario_nome',
            'status', 'descricao', 'data_criacao', 'data_finalizacao',
            'custo_total', 'etapas', 'materiais'
        ]

    def get_funcionario_nome(self, obj):
        return obj.funcionario.get_full_name() or obj.funcionario.username


class CriarOrdemServicoSerializer(serializers.Serializer):
    """Serializer de ENTRADA para criar Ordem de Serviço"""
    atendimento_id = serializers.IntegerField()
    descricao = serializers.CharField(required=False, allow_blank=True, default='')
    etapas = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        help_text='Lista de etapas no formato [{"nome": "Lavagem", "tempo_estimado": "00:30:00", "ordem": 1}]'
    )
    materiais = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        help_text='Lista de materiais no formato [{"nome": "Shampoo", "quantidade": 2, "unidade": "L", "custo_unitario": 15.50}]'
    )

    def validate_atendimento_id(self, value):
        """Valida que o atendimento existe e não possui OS aberta"""
        try:
            atendimento = Atendimento.objects.get(id=value)
        except Atendimento.DoesNotExist:
            raise serializers.ValidationError("Atendimento não encontrado")
        
        # Verifica se já existe OS aberta para este atendimento
        if OrdemServico.objects.filter(atendimento_id=value, status='aberta').exists():
            raise serializers.ValidationError("Já existe uma OS aberta para este atendimento")
        
        return value


class AtualizarOrdemServicoSerializer(serializers.ModelSerializer):
    """Serializer para atualizar status e descrição da OS"""
    class Meta:
        model = OrdemServico
        fields = ['status', 'descricao']

    def validate_status(self, value):
        """Valida transições de status"""
        if value == 'finalizada':
            # Validação adicional será feita na view
            pass
        return value


class FinalizarOSSerializer(serializers.Serializer):
    """Serializer para finalizar OS com observações opcionais"""
    observacoes = serializers.CharField(required=False, allow_blank=True, default='')
