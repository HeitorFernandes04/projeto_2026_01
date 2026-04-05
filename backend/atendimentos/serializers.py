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
        fields = ['id', 'placa', 'modelo', 'marca', 'cor', 'nome_dono', 'celular_dono', 'ano']

class AtendimentoSerializer(serializers.ModelSerializer):
    veiculo = VeiculoSerializer(read_only=True)
    servico = ServicoSerializer(read_only=True)
    midias = serializers.SerializerMethodField()

    class Meta:
        model = Atendimento
        fields = [
            'id', 'veiculo', 'servico', 'data_hora', 'status', 'etapa_atual',
            'horario_inicio', 'horario_lavagem', 'horario_acabamento', 'horario_finalizacao',
            'observacoes', 'midias', 'laudo_vistoria', 'partes_avaria', 
            'laudo_lavagem', 'checklist_lavagem', 'laudo_acabamento', 
            'vaga_patio', 'notas_entrega'
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
            'status', 'etapa_atual', 'laudo_vistoria', 'partes_avaria', 
            'laudo_lavagem', 'checklist_lavagem', 'laudo_acabamento', 
            'vaga_patio', 'notas_entrega'
        ]

# ---------------------------------------------------------------------------
#  RF-04 — Criar atendimento
# ---------------------------------------------------------------------------

class CriarAtendimentoSerializer(serializers.Serializer):
    """Serializer de ENTRADA para criar um atendimento com veículo embutido."""
    nome_dono    = serializers.CharField()
    celular_dono = serializers.CharField(required=False, allow_blank=True, default='')
    placa        = serializers.CharField()
    modelo       = serializers.CharField()
    marca        = serializers.CharField()
    cor          = serializers.CharField(required=False, allow_blank=True, default='')
    ano          = serializers.IntegerField(required=False, allow_null=True)
    servico_id   = serializers.IntegerField()
    data_hora    = serializers.DateTimeField()
    observacoes  = serializers.CharField(required=False, allow_blank=True, default='')
    iniciar_agora = serializers.BooleanField(required=False, default=False)

# ---------------------------------------------------------------------------
#  RF-05/06 — Upload de fotos
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
        max_length=10, # Aumentado para 10 conforme sua necessidade
        help_text='Lista de imagens para upload (máximo 10).',
    )

class MidiaAtendimentoSerializer(serializers.ModelSerializer):
    """Serializer de SAÍDA — devolve URL absoluta do arquivo."""
    arquivo = serializers.SerializerMethodField()

    class Meta:
        model = MidiaAtendimento
        fields = ['id', 'atendimento', 'arquivo', 'momento', 'parte_nome', 'enviado_em']

    def get_arquivo(self, obj):
        request = self.context.get('request')
        if request and obj.arquivo:
            return request.build_absolute_uri(obj.arquivo.url)
        return None

# ---------------------------------------------------------------------------
#  RF-07 — Atualização de Comentários e Laudos por Etapa
# ---------------------------------------------------------------------------

class AtualizarComentarioSerializer(serializers.ModelSerializer):
    """
    Serializer expandido para a RF-07. 
    Permite atualizar observações e laudos técnicos de todas as etapas de forma parcial.
    """
    class Meta:
        model = Atendimento
        fields = [
            'status', 'observacoes', 'laudo_vistoria', 'partes_avaria', 
            'laudo_lavagem', 'checklist_lavagem', 'laudo_acabamento', 
            'vaga_patio', 'notas_entrega'
        ]

class HistoricoAtendimentoFiltroSerializer(serializers.Serializer):
    """Serializer de entrada para filtro de histórico por período."""
    data_inicial = serializers.DateField()
    data_final = serializers.DateField()
    status = serializers.ChoiceField(
        choices=['todos', *[status for status, _ in Atendimento.STATUS_CHOICES]],
        required=False,
        default='todos',
    )