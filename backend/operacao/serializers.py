from rest_framework import serializers
from .models import OrdemServico, MidiaOrdemServico
from core.models import Servico, TagPeca, Veiculo
from operacao.models import IncidenteOS
from django.utils import timezone
import os
import re


class ServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servico
        fields = ['id', 'nome', 'preco', 'duracao_estimada_minutos']


class VeiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Veiculo
        fields = ['id', 'placa', 'modelo', 'marca', 'cor']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        placa = ret.get('placa', '')
        # RN: Aplica máscara visual na saída da API (AAA-1234 ou AAA-1A23)
        if len(placa) == 7 and '-' not in placa:
            ret['placa'] = f"{placa[:3]}-{placa[3:]}"
        return ret


class MidiaOrdemServicoSerializer(serializers.ModelSerializer):
    """Serializer de SAÍDA - devolve URL absoluta do arquivo."""
    arquivo = serializers.SerializerMethodField()

    class Meta:
        model = MidiaOrdemServico
        fields = ['id', 'ordem_servico', 'arquivo', 'momento']

    def get_arquivo(self, obj):
        request = self.context.get('request')
        if request and obj.arquivo:
            return request.build_absolute_uri(obj.arquivo.url)
        return None


class OrdemServicoSerializer(serializers.ModelSerializer):
    veiculo = VeiculoSerializer(read_only=True)
    servico = ServicoSerializer(read_only=True)
    midias = MidiaOrdemServicoSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    # Campo virtual para controlar a esteira no Frontend
    etapa_atual = serializers.SerializerMethodField()

    class Meta:
        model = OrdemServico
        fields = [
            'id', 'veiculo', 'servico', 'data_hora', 'status', 'status_display',
            'etapa_atual',
            'laudo_vistoria', 'comentario_lavagem', 'comentario_acabamento',
            'vaga_patio', 'horario_lavagem',
            'horario_acabamento', 'horario_finalizacao', 'observacoes', 'midias'
        ]
        read_only_fields = [
            'horario_lavagem',
            'horario_acabamento', 'horario_finalizacao'
        ]

    def get_etapa_atual(self, obj):
        """Lógica de Redirecionamento Cronológica Estrita."""
        if obj.status in ('FINALIZADO', 'LIBERACAO') or obj.horario_finalizacao or obj.comentario_acabamento:
            return 4
        if obj.horario_acabamento:
            return 3
        if obj.horario_lavagem:
            return 2
        return 1


# ---------------------------------------------------------------------------
#  RF-04 - Criar OS (COM VALIDAÇÃO DE DATA E STATUS)
# ---------------------------------------------------------------------------

class CriarOrdemServicoSerializer(serializers.Serializer):
    """Serializer de ENTRADA para criar uma OS com veículo embutido."""
    placa        = serializers.CharField()
    modelo       = serializers.CharField()

    def validate_placa(self, value):
        """RN: Aceita placas no formato Antigo (ABC1234) e Mercosul (ABC1D23)."""
        placa_normalizada = re.sub(r'[^A-Z0-9]', '', value.strip().upper())
        padrao = r'^[A-Z]{3}\d[\dA-Z]\d{2}$'
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
        """RN: Impede agendamento simultâneo para HOJE se já houver OS em execução."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return data

        data_agendamento = data.get('data_hora').date()
        hoje = timezone.now().date()

        tem_servico_ativo = OrdemServico.objects.filter(
            funcionario=request.user,
            status__in=['VISTORIA_INICIAL', 'EM_EXECUCAO']
        ).exists()

        if data_agendamento <= hoje and tem_servico_ativo:
            raise serializers.ValidationError(
                "Você já possui uma OS em execução. Finalize-a antes de iniciar ou agendar outra para hoje."
            )

        return data


# ---------------------------------------------------------------------------
#  RF-05/06 - Upload de fotos
# ---------------------------------------------------------------------------

EXTENSOES_PERMITIDAS = {'.jpg', '.jpeg', '.png', '.webp'}


def validar_extensao_imagem(arquivo):
    ext = os.path.splitext(arquivo.name)[1].lower()
    if ext not in EXTENSOES_PERMITIDAS:
        raise serializers.ValidationError(f'Extensão "{ext}" não permitida.')


class MidiaOrdemServicoUploadSerializer(serializers.Serializer):
    momento = serializers.ChoiceField(choices=['VISTORIA_GERAL', 'FINALIZADO', 'AVARIA_PREVIA', 'EXECUCAO'])
    arquivos = serializers.ListField(
        child=serializers.ImageField(validators=[validar_extensao_imagem]),
        allow_empty=False,
        max_length=5,
    )


class HistoricoOrdemServicoFiltroSerializer(serializers.Serializer):
    data_inicial = serializers.DateField()
    data_final = serializers.DateField()
    status = serializers.ChoiceField(
        choices=['todos', *[s for s, _ in OrdemServico.STATUS_CHOICES]],
        required=False,
        default='todos',
    )


class ProximaEtapaSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrdemServico
        fields = ['laudo_vistoria', 'comentario_lavagem', 'comentario_acabamento']


class FinalizarIndustrialSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrdemServico
        fields = ['vaga_patio', 'observacoes']


class TagPecaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TagPeca
        fields = '__all__'


class KanbanCardSerializer(serializers.ModelSerializer):
    """RF-14: Card do Kanban com campos exigidos pelo CA-02."""

    placa = serializers.CharField(source='veiculo.placa')
    modelo = serializers.CharField(source='veiculo.modelo')
    servico = serializers.CharField(source='servico.nome')
    duracao_estimada_minutos = serializers.IntegerField(source='servico.duracao_estimada_minutos')
    tempo_decorrido_minutos = serializers.SerializerMethodField()
    is_atrasado = serializers.SerializerMethodField()

    class Meta:
        model = OrdemServico
        fields = ['id', 'placa', 'modelo', 'servico', 'duracao_estimada_minutos', 'tempo_decorrido_minutos', 'is_atrasado']

    def get_tempo_decorrido_minutos(self, obj):
        # RN: PATIO ainda não iniciou execução — tempo zero
        if obj.status == 'PATIO' or not obj.horario_lavagem:
            return 0
        # RN: BLOQUEADO_INCIDENTE — congela no momento do último incidente
        if obj.status == 'BLOQUEADO_INCIDENTE':
            incidentes = list(obj.incidentes.all())
            if incidentes:
                ultimo = max(incidentes, key=lambda i: i.data_registro)
                delta = ultimo.data_registro - obj.horario_lavagem
                return max(0, int(delta.total_seconds() / 60))
        # RN: LIBERACAO — execução encerrada, congela no fim do acabamento
        if obj.status == 'LIBERACAO' and obj.horario_acabamento:
            delta = obj.horario_acabamento - obj.horario_lavagem
            return max(0, int(delta.total_seconds() / 60))
        # RN: FINALIZADO — congela no horário de finalização real
        if obj.status == 'FINALIZADO' and obj.horario_finalizacao:
            delta = obj.horario_finalizacao - obj.horario_lavagem
            return max(0, int(delta.total_seconds() / 60))
        delta = timezone.now() - obj.horario_lavagem
        return int(delta.total_seconds() / 60)

    def get_is_atrasado(self, obj):
        if obj.status not in ('EM_EXECUCAO', 'LIBERACAO'):
            return False
        return self.get_tempo_decorrido_minutos(obj) > obj.servico.duracao_estimada_minutos

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        placa = ret.get('placa', '')
        if len(placa) == 7 and '-' not in placa:
            ret['placa'] = f"{placa[:3]}-{placa[3:]}"
        return ret


class IncidenteOSSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidenteOS
        fields = ['ordem_servico', 'tag_peca', 'descricao', 'foto_url']


class IncidentePendenteSerializer(serializers.ModelSerializer):
    ordem_servico_id = serializers.IntegerField(source='ordem_servico.id', read_only=True)
    status_ordem_servico = serializers.CharField(source='ordem_servico.status', read_only=True)
    placa = serializers.CharField(source='ordem_servico.veiculo.placa', read_only=True)
    modelo = serializers.CharField(source='ordem_servico.veiculo.modelo', read_only=True)
    servico = serializers.CharField(source='ordem_servico.servico.nome', read_only=True)
    tag_peca = serializers.CharField(source='tag_peca.nome', read_only=True)
    foto_url = serializers.SerializerMethodField()

    class Meta:
        model = IncidenteOS
        fields = [
            'id',
            'ordem_servico_id',
            'status_ordem_servico',
            'placa',
            'modelo',
            'servico',
            'tag_peca',
            'descricao',
            'foto_url',
            'data_registro',
        ]

    def get_foto_url(self, obj):
        request = self.context.get('request')
        if request and obj.foto_url:
            return request.build_absolute_uri(obj.foto_url.url)
        return None

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        placa = ret.get('placa', '')
        if len(placa) == 7 and '-' not in placa:
            ret['placa'] = f"{placa[:3]}-{placa[3:]}"
        return ret


class IncidenteAuditoriaOrdemServicoSerializer(serializers.ModelSerializer):
    placa = serializers.CharField(source='veiculo.placa', read_only=True)
    modelo = serializers.CharField(source='veiculo.modelo', read_only=True)
    servico = serializers.CharField(source='servico.nome', read_only=True)

    class Meta:
        model = OrdemServico
        fields = [
            'id',
            'status',
            'placa',
            'modelo',
            'servico',
            'horario_lavagem',
            'horario_acabamento',
            'horario_finalizacao',
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        placa = ret.get('placa', '')
        if len(placa) == 7 and '-' not in placa:
            ret['placa'] = f"{placa[:3]}-{placa[3:]}"
        return ret


class IncidenteAuditoriaTagPecaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TagPeca
        fields = ['id', 'nome', 'categoria']


class IncidenteAuditoriaVistoriaItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    possui_avaria = serializers.BooleanField()
    foto_url = serializers.SerializerMethodField()

    def get_foto_url(self, obj):
        request = self.context.get('request')
        if request and getattr(obj, 'foto_url', None):
            return request.build_absolute_uri(obj.foto_url.url)
        return None


class IncidenteAuditoriaSerializer(serializers.ModelSerializer):
    ordem_servico = IncidenteAuditoriaOrdemServicoSerializer(read_only=True)
    tag_peca = IncidenteAuditoriaTagPecaSerializer(read_only=True)
    foto_url = serializers.SerializerMethodField()
    vistoria_item = serializers.SerializerMethodField()
    vista_inicial_foto_url = serializers.SerializerMethodField()

    class Meta:
        model = IncidenteOS
        fields = [
            'id',
            'descricao',
            'foto_url',
            'data_registro',
            'resolvido',
            'status_anterior_os',
            'ordem_servico',
            'tag_peca',
            'vistoria_item',
            'vista_inicial_foto_url',
        ]

    def get_foto_url(self, obj):
        request = self.context.get('request')
        if request and obj.foto_url:
            return request.build_absolute_uri(obj.foto_url.url)
        return None

    def get_vistoria_item(self, obj):
        vistoria_item = getattr(obj, 'vistoria_item_auditavel', None)
        if not vistoria_item:
            return None
        return IncidenteAuditoriaVistoriaItemSerializer(
            vistoria_item,
            context=self.context,
        ).data

    def get_vista_inicial_foto_url(self, obj):
        vistoria_item = getattr(obj, 'vistoria_item_auditavel', None)
        if not vistoria_item:
            return None
        request = self.context.get('request')
        if request and getattr(vistoria_item, 'foto_url', None):
            return request.build_absolute_uri(vistoria_item.foto_url.url)
        return None

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if ret.get('ordem_servico'):
            ret['ordem_servico']['status_anterior_os'] = ret.get('status_anterior_os')
        return ret


class ResolverIncidenteSerializer(serializers.Serializer):
    observacoes_resolucao = serializers.CharField(
        allow_blank=False,
        error_messages={
            'required': 'A nota de resolução é obrigatória.',
            'blank': 'A nota de resolução é obrigatória.',
        },
    )


# ---------------------------------------------------------------------------
#  RF-17 — Histórico do Gestor
# ---------------------------------------------------------------------------

class HistoricoGestorFiltroSerializer(serializers.Serializer):
    data_inicio           = serializers.DateField(required=False)
    data_fim              = serializers.DateField(required=False)
    placa                 = serializers.CharField(required=False, allow_blank=True)
    status                = serializers.ChoiceField(
        choices=[s for s, _ in OrdemServico.STATUS_CHOICES],
        required=False,
    )
    com_incidente_resolvido = serializers.BooleanField(required=False, default=False)


class HistoricoGestorItemSerializer(serializers.ModelSerializer):
    placa          = serializers.CharField(source='veiculo.placa')
    modelo         = serializers.CharField(source='veiculo.modelo')
    servico_nome   = serializers.CharField(source='servico.nome')
    funcionario_nome = serializers.SerializerMethodField()

    class Meta:
        model = OrdemServico
        fields = [
            'id', 'placa', 'modelo', 'servico_nome', 'funcionario_nome',
            'status', 'data_hora',
            'horario_lavagem', 'horario_finalizacao',
        ]

    def get_funcionario_nome(self, obj):
        if obj.funcionario and hasattr(obj.funcionario, 'name'):
            return obj.funcionario.name
        return None

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        placa = ret.get('placa', '')
        if len(placa) == 7 and '-' not in placa:
            ret['placa'] = f"{placa[:3]}-{placa[3:]}"
        return ret


# ---------------------------------------------------------------------------
#  RF-18 — Galeria/Dossiê da OS
# ---------------------------------------------------------------------------

class MidiaGaleriaSerializer(serializers.ModelSerializer):
    arquivo_url = serializers.SerializerMethodField()

    class Meta:
        model = MidiaOrdemServico
        fields = ['id', 'arquivo_url', 'momento']

    def get_arquivo_url(self, obj):
        request = self.context.get('request')
        if request and obj.arquivo:
            return request.build_absolute_uri(obj.arquivo.url)
        return None
