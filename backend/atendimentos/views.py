from django.core.exceptions import ValidationError
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import TagPeca, IncidenteOS
from .serializers import TagPecaSerializer, IncidenteOSSerializer
from .services import IncidenteService
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Atendimento, Servico
from .permissions import IsFuncionarioDoAtendimento
from .serializers import (
    AtendimentoSerializer,
    CriarAtendimentoSerializer,
    HistoricoAtendimentoFiltroSerializer,
    MidiaAtendimentoSerializer,
    MidiaAtendimentoUploadSerializer,
    ServicoSerializer,
    ProximaEtapaSerializer,
    FinalizarIndustrialSerializer,
)
from .services import AtendimentoService, MidiaAtendimentoService


class AtendimentosHojeView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hoje = timezone.localdate()
        # Filtra atendimentos do dia que não têm funcionário ou são do próprio usuário
        atendimentos = Atendimento.objects.filter(
            Q(funcionario__isnull=True) | Q(funcionario=request.user),
            data_hora__date=hoje,
        ).select_related('veiculo', 'servico').prefetch_related('midias').order_by('data_hora')

        serializer = AtendimentoSerializer(atendimentos, many=True, context={'request': request})
        return Response(serializer.data)


class HistoricoAtendimentosView(APIView):
    """GET /api/atendimentos/historico/"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        filtro_serializer = HistoricoAtendimentoFiltroSerializer(data=request.query_params)
        filtro_serializer.is_valid(raise_exception=True)

        try:
            atendimentos = AtendimentoService.listar_historico_por_periodo(
                funcionario=request.user,
                data_inicial=filtro_serializer.validated_data['data_inicial'],
                data_final=filtro_serializer.validated_data['data_final'],
                status=filtro_serializer.validated_data['status'],
            )
        except ValidationError as e:
            return Response(
                {'detail': e.messages[0] if hasattr(e, 'messages') else str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AtendimentoSerializer(atendimentos, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class AtendimentoDetailView(APIView):
    """GET /api/atendimentos/{id}/"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsFuncionarioDoAtendimento]

    def get(self, request, pk):
        serializer = AtendimentoSerializer(request.atendimento, context={'request': request})
        return Response(serializer.data)


class CriarAtendimentoView(APIView):
    """POST /api/atendimentos/"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CriarAtendimentoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            atendimento = AtendimentoService.criar_com_veiculo(
                dados=serializer.validated_data,
                funcionario=request.user,
            )
        except ValidationError as e:
            return Response(
                {'detail': e.messages[0] if hasattr(e, 'messages') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(AtendimentoSerializer(atendimento, context={'request': request}).data, status=status.HTTP_201_CREATED)


class AvancarEtapaView(APIView):
    """
    PATCH /api/atendimentos/{id}/avancar/
    Endpoint unificado para as transições da esteira (Vistoria -> Lavagem -> Acabamento).
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsFuncionarioDoAtendimento]

    def patch(self, request, pk):
        serializer = ProximaEtapaSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Axioma 1: Delega toda a validação de fotos e lógica de estado ao Service
            atendimento = AtendimentoService.avancar_etapa(pk, serializer.validated_data)
            return Response(AtendimentoSerializer(atendimento, context={'request': request}).data)
        except (ValueError, ValidationError) as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class FinalizarIndustrialView(APIView):
    """
    PATCH /api/atendimentos/{id}/finalizar-industrial/
    Finaliza o atendimento na etapa 4 (Liberação) validando fotos DEPOIS e vaga.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsFuncionarioDoAtendimento]

    def patch(self, request, pk):
        serializer = FinalizarIndustrialSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            atendimento = AtendimentoService.finalizar_atendimento_industrial(pk, serializer.validated_data)
            return Response(AtendimentoSerializer(atendimento, context={'request': request}).data)
        except (ValueError, ValidationError) as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class FotoUploadView(APIView):
    """POST /api/atendimentos/{id}/fotos/"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsFuncionarioDoAtendimento]

    def post(self, request, pk):
        atendimento = request.atendimento
        serializer = MidiaAtendimentoUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            midias = MidiaAtendimentoService.processar_upload_multiplo(
                atendimento=atendimento,
                momento=serializer.validated_data['momento'],
                arquivos=serializer.validated_data['arquivos'],
            )
            output = MidiaAtendimentoSerializer(midias, many=True, context={'request': request})
            return Response(output.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'detail': e.message}, status=status.HTTP_400_BAD_REQUEST)


class ServicoListView(APIView):
    def get(self, request):
        servicos = Servico.objects.all()
        return Response(ServicoSerializer(servicos, many=True).data)


class HorariosLivresView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_str = request.query_params.get('data')
        servico_id = request.query_params.get('servico_id')
        if not data_str or not servico_id:
            return Response({'detail': 'Data e serviço são obrigatórios.'}, status=400)

        try:
            horarios = AtendimentoService.get_horarios_livres(data_str, servico_id)
            return Response({'horarios': horarios})
        except Exception as e:
            return Response({'detail': str(e)}, status=400)
        


class TagPecaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TagPeca.objects.all()
    serializer_class = TagPecaSerializer

@api_view(['POST'])
def registrar_incidente(request, pk):
    """Endpoint para o operador relatar um dano e travar a OS."""
    try:
        # Chama o serviço que criamos anteriormente para processar foto e status
        incidente = IncidenteService.registrar_incidente(
            atendimento_id=pk,
            dados=request.data,
            arquivo_foto=request.FILES.get('foto_url')
        )
        return Response({'status': 'OS bloqueada por incidente'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)