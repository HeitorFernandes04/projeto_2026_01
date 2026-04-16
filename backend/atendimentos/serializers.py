from rest_framework import serializers
from .models import Atendimento, IncidenteOS, MidiaAtendimento, Servico, TagPeca, Veiculo
from django.utils import timezone
import os
import re

class ServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servico
        fields = ['id', 'nome', 'preco', 'duracao_estimada_min']


class VeiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Veiculo
        fields = ['id', 'placa', 'modelo', 'marca', 'cor', 'nome_dono', 'celular_dono']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        placa = ret.get('placa', '')
        # RN: Aplica máscara visual na saída da API (AAA-1234 ou AAA-1A23)
        if len(placa) == 7 and '-' not in placa:
            ret['placa'] = f"{placa[:3]}-{placa[3:]}"
        return ret


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
        """Lógica de Redirecionamento Cronológica Estrita."""
        if obj.status == 'finalizado' or obj.horario_finalizacao or obj.comentario_acabamento:
            return 4
        if obj.horario_acabamento:
            return 3
        if obj.horario_lavagem:
            return 2
        return 1

# ---------------------------------------------------------------------------
#  RF-04 — Criar atendimento (COM VALIDAÇÃO DE DATA E STATUS)
# ---------------------------------------------------------------------------

class CriarAtendimentoSerializer(serializers.Serializer):
    """Serializer de ENTRADA para criar um atendimento com veículo embutido."""
    nome_dono    = serializers.CharField()
    celular_dono = serializers.CharField(required=False, allow_blank=True, default='')
    placa        = serializers.CharField()
    modelo       = serializers.CharField()

    def validate_placa(self, value):
        """RN: Aceita placas no formato Antigo (ABC1234) e Mercosul (ABC1D23)."""
        # Normaliza: Remove hífens ou espaços que a máscara do front possa ter enviado
        placa_normalizada = re.sub(r'[^A-Z0-9]', '', value.strip().upper())
        padrao = r'^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$'
        if not re.match(padrao, placa_normalizada):
            raise serializers.ValidationError(
                'Placa inválida. Use o formato antigo (ABC1234) ou Mercosul (ABC1D23).'
            )
        return placa_normalizada
    marca        = serializers.CharField()
    cor          = serializers.CharField(required=False, allow_blank=True, default='')
    servico_id   = serializers.IntegerField()
    data_hora    = serializers.DateTimeField()
    observacoes  = serializers.CharField(required=False, allow_blank=True, default='')
    iniciar_agora = serializers.BooleanField(required=False, default=False)

    def validate(self, data):
        """
        RN: Impede agendamento simultâneo para HOJE se houver algo em andamento.
        Permite agendamentos para datas futuras livremente.
        """
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return data

        data_agendamento = data.get('data_hora').date()
        hoje = timezone.now().date()
        
        # Verifica se o funcionário logado já possui uma OS com status 'em_andamento'
        tem_servico_ativo = Atendimento.objects.filter(
            funcionario=request.user,
            status='em_andamento'
        ).exists()

        # BLOQUEIO: Se for para HOJE (ou passado) e já tiver um carro na esteira
        if data_agendamento <= hoje and tem_servico_ativo:
            raise serializers.ValidationError(
                "Você já possui um veículo em andamento. Finalize-o antes de iniciar ou agendar outro para hoje."
            )
        
        return data


# ---------------------------------------------------------------------------
#  RF-05/06 — Upload de fotos
# ---------------------------------------------------------------------------

EXTENSOES_PERMITIDAS = {'.jpg', '.jpeg', '.png', '.webp'}

def validar_extensao_imagem(arquivo):
    ext = os.path.splitext(arquivo.name)[1].lower()
    if ext not in EXTENSOES_PERMITIDAS:
        raise serializers.ValidationError(f'Extensão "{ext}" não permitida.')


class MidiaAtendimentoUploadSerializer(serializers.Serializer):
    momento = serializers.ChoiceField(choices=['VISTORIA_GERAL', 'FINALIZADO', 'AVARIA_PREVIA', 'EXECUCAO'])
    arquivos = serializers.ListField(
        child=serializers.ImageField(validators=[validar_extensao_imagem]),
        allow_empty=False,
        max_length=5,
    )


class HistoricoAtendimentoFiltroSerializer(serializers.Serializer):
    data_inicial = serializers.DateField()
    data_final = serializers.DateField()
    status = serializers.ChoiceField(
        choices=['todos', *[status for status, _ in Atendimento.STATUS_CHOICES]],
        required=False,
        default='todos',
    )

class ProximaEtapaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Atendimento
        fields = ['laudo_vistoria', 'comentario_lavagem', 'comentario_acabamento']

class FinalizarIndustrialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Atendimento
        fields = ['vaga_patio', 'observacoes']

class TagPecaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TagPeca
        fields = '__all__'

class IncidenteOSSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidenteOS
        fields = ['atendimento', 'tag_peca', 'descricao', 'foto_url']