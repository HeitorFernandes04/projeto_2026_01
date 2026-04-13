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


class AtendimentoSerializer(serializers.ModelSerializer):
    veiculo = VeiculoSerializer(read_only=True)
    servico = ServicoSerializer(read_only=True)
    midias = MidiaAtendimentoSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # Campo virtual para controlar a esteira no Frontend
    etapa_atual = serializers.SerializerMethodField()

    class Meta:
        model = Atendimento
        fields = [
            'id', 'veiculo', 'servico', 'data_hora', 'status', 'status_display',
            'etapa_atual', 
            'laudo_vistoria', 'comentario_lavagem', 'comentario_acabamento', 
            'vaga_patio', 'horario_inicio', 'horario_lavagem', 
            'horario_acabamento', 'horario_finalizacao', 'observacoes', 'midias'
        ]
        read_only_fields = [
            'horario_inicio', 'horario_lavagem', 
            'horario_acabamento', 'horario_finalizacao'
        ]

    def get_etapa_atual(self, obj):
        """
        Lógica de Redirecionamento Cronológica Estrita.
        """
        # 4. Liberação: Se já finalizou OU se o acabamento já tem comentário/vaga
        if obj.status == 'finalizado' or obj.horario_finalizacao or obj.comentario_acabamento:
            return 4
        
        # 3. Acabamento: Se a lavagem terminou (tem horario_acabamento)
        if obj.horario_acabamento:
            return 3
            
        # 2. Lavagem: Se passou pela vistoria (tem horario_lavagem)
        if obj.horario_lavagem:
            return 2
            
        # 1. Vistoria: Estado inicial
        return 1
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
    """Serializer de ENTRADA para upload de múltiplas fotos (RN-09)."""
    momento = serializers.ChoiceField(choices=['ANTES', 'DEPOIS'])
    arquivos = serializers.ListField(
        child=serializers.ImageField(validators=[validar_extensao_imagem]),
        allow_empty=False,
        max_length=5,
    )


class HistoricoAtendimentoFiltroSerializer(serializers.Serializer):
    """Serializer de entrada para filtro de histórico por período (RF-10)."""
    data_inicial = serializers.DateField()
    data_final = serializers.DateField()
    status = serializers.ChoiceField(
        choices=['todos', *[status for status, _ in Atendimento.STATUS_CHOICES]],
        required=False,
        default='todos',
    )

class ProximaEtapaSerializer(serializers.ModelSerializer):
    """Serializer unificado para transição de fases da esteira."""
    class Meta:
        model = Atendimento
        fields = ['laudo_vistoria', 'comentario_lavagem', 'comentario_acabamento']

class FinalizarIndustrialSerializer(serializers.ModelSerializer):
    """Serializer para a fase final de Liberação."""
    class Meta:
        model = Atendimento
        fields = ['vaga_patio', 'observacoes']