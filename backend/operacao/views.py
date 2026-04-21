from django.core.exceptions import ValidationError
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from core.models import TagPeca, Servico
from operacao.models import OrdemServico, MidiaOrdemServico
from .serializers import TagPecaSerializer, IncidenteOSSerializer
from .services import IncidenteService
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .permissions import IsFuncionarioDaOS, IsGestor
from .serializers import (
    KanbanCardSerializer,
    OrdemServicoSerializer,
    CriarOrdemServicoSerializer,
    HistoricoOrdemServicoFiltroSerializer,
    HistoricoGestorFiltroSerializer,
    HistoricoGestorItemSerializer,
    MidiaGaleriaSerializer,
    MidiaOrdemServicoSerializer,
    MidiaOrdemServicoUploadSerializer,
    ServicoSerializer,
    ProximaEtapaSerializer,
    FinalizarIndustrialSerializer,
)
from .services import OrdemServicoService, MidiaOrdemServicoService, KanbanService, HistoricoGestorService


class OrdensServicoHojeView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hoje = timezone.localdate()
        # Exibe OS sem funcionário ou do próprio usuário (fila do pátio)
        ordens = OrdemServico.objects.filter(
            Q(funcionario__isnull=True) | Q(funcionario=request.user),
            data_hora__date=hoje,
        ).select_related('veiculo', 'servico').prefetch_related('midias').order_by('data_hora')

        serializer = OrdemServicoSerializer(ordens, many=True, context={'request': request})
        return Response(serializer.data)


class HistoricoOrdemServicoView(APIView):
    """GET /api/ordens-servico/historico/"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        filtro_serializer = HistoricoOrdemServicoFiltroSerializer(data=request.query_params)
        filtro_serializer.is_valid(raise_exception=True)

        try:
            ordens = OrdemServicoService.listar_historico_por_periodo(
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

        serializer = OrdemServicoSerializer(ordens, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class OrdemServicoDetailView(APIView):
    """GET /api/ordens-servico/{id}/"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsFuncionarioDaOS]

    def get(self, request, pk):
        serializer = OrdemServicoSerializer(request.ordem_servico, context={'request': request})
        return Response(serializer.data)


class CriarOrdemServicoView(APIView):
    """POST /api/ordens-servico/"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CriarOrdemServicoSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        try:
            os = OrdemServicoService.criar_com_veiculo(
                dados=serializer.validated_data,
                funcionario=request.user,
            )
        except ValidationError as e:
            return Response(
                {'detail': e.messages[0] if hasattr(e, 'messages') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(OrdemServicoSerializer(os, context={'request': request}).data, status=status.HTTP_201_CREATED)


class AvancarEtapaView(APIView):
    """
    PATCH /api/ordens-servico/{id}/avancar-etapa/
    Endpoint unificado para transições da esteira.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsFuncionarioDaOS]

    def patch(self, request, pk):
        serializer = ProximaEtapaSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        try:
            os = OrdemServicoService.avancar_etapa(pk, serializer.validated_data)
            return Response(OrdemServicoSerializer(os, context={'request': request}).data)
        except (ValueError, ValidationError) as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class FinalizarIndustrialView(APIView):
    """
    PATCH /api/ordens-servico/{id}/finalizar/
    Finaliza a OS na etapa 4 (Liberação) validando fotos FINALIZADO e vaga.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsFuncionarioDaOS]

    def patch(self, request, pk):
        serializer = FinalizarIndustrialSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            os = OrdemServicoService.finalizar_ordem_servico_industrial(pk, serializer.validated_data)
            return Response(OrdemServicoSerializer(os, context={'request': request}).data)
        except (ValueError, ValidationError) as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class FotoUploadView(APIView):
    """POST /api/ordens-servico/{id}/fotos/"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsFuncionarioDaOS]

    def post(self, request, pk):
        ordem_servico = request.ordem_servico
        arquivos = request.FILES.getlist('arquivos')

        serializer = MidiaOrdemServicoUploadSerializer(data={
            'momento': request.data.get('momento'),
            'arquivos': arquivos
        })
        serializer.is_valid(raise_exception=True)

        try:
            midias = MidiaOrdemServicoService.processar_upload_multiplo(
                ordem_servico=ordem_servico,
                momento=serializer.validated_data['momento'],
                arquivos=serializer.validated_data['arquivos'],
            )
            output = MidiaOrdemServicoSerializer(midias, many=True, context={'request': request})
            return Response(output.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'detail': e.message}, status=status.HTTP_400_BAD_REQUEST)


class ServicoListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Obter o estabelecimento do usuário logado (Gestor ou Funcionário)
        estabelecimento = None
        if hasattr(request.user, 'perfil_gestor'):
            estabelecimento = request.user.perfil_gestor.estabelecimento
        elif hasattr(request.user, 'perfil_funcionario'):
            estabelecimento = request.user.perfil_funcionario.estabelecimento
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Usuário sem estabelecimento vinculado.")
        
        if not Servico.objects.exists():
            Servico.objects.bulk_create([
                Servico(nome="Lavagem Simples", preco=50.00, duracao_estimada_minutos=45, estabelecimento=estabelecimento),
                Servico(nome="Lavagem Completa", preco=80.00, duracao_estimada_minutos=90, estabelecimento=estabelecimento),
                Servico(nome="Higienização Interna", preco=150.00, duracao_estimada_minutos=180, estabelecimento=estabelecimento),
            ])

        # Filtrar serviços pelo estabelecimento do usuário (RNF-01: Multi-locação)
        servicos = Servico.objects.filter(
            estabelecimento=estabelecimento,
            is_active=True
        )
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
            horarios = OrdemServicoService.get_horarios_livres(data_str, servico_id)
            return Response({'horarios': horarios})
        except Exception as e:
            return Response({'detail': str(e)}, status=400)


class KanbanAPIView(APIView):
    """RF-14: GET /api/ordens-servico/kanban/ — OS do dia agrupadas por status."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsGestor]

    def get(self, request):
        estabelecimento = request.user.perfil_gestor.estabelecimento
        ordens = KanbanService.listar_por_estabelecimento(estabelecimento)

        kanban = {col: [] for col in KanbanService.COLUNAS}
        for os in ordens:
            kanban[os.status].append(os)

        return Response({
            col: KanbanCardSerializer(items, many=True).data
            for col, items in kanban.items()
        })


class TagPecaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TagPeca.objects.all()
    serializer_class = TagPecaSerializer


@api_view(['POST'])
def registrar_incidente(request, pk):
    """Endpoint para o operador relatar um dano e travar a OS."""
    try:
        IncidenteService.registrar_incidente(
            os_id=pk,
            dados=request.data,
            arquivo_foto=request.FILES.get('foto_url')
        )
        return Response({'status': 'OS bloqueada por incidente'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
#  RF-17 — Histórico Consolidado de Atendimentos (Gestor)
# ---------------------------------------------------------------------------

class HistoricoGestorListView(APIView):
    """GET /api/ordens-servico/gestor/historico/"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsGestor]

    def get(self, request):
        filtro = HistoricoGestorFiltroSerializer(data=request.query_params)
        filtro.is_valid(raise_exception=True)
        d = filtro.validated_data

        estabelecimento = request.user.perfil_gestor.estabelecimento

        try:
            queryset = HistoricoGestorService.listar_historico_gestor(
                estabelecimento=estabelecimento,
                data_inicio=d.get('data_inicio'),
                data_fim=d.get('data_fim'),
                placa=d.get('placa'),
                status=d.get('status'),
            )
        except ValidationError as e:
            return Response(
                {'detail': e.messages[0] if hasattr(e, 'messages') else str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = 15
        page = paginator.paginate_queryset(queryset, request)
        serializer = HistoricoGestorItemSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)


# ---------------------------------------------------------------------------
#  RF-18 — Auditoria de Qualidade Visual / Galeria da OS (Gestor)
# ---------------------------------------------------------------------------

class HistoricoGestorFotosView(APIView):
    """GET /api/ordens-servico/gestor/historico/{id}/fotos/"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsGestor]

    def get(self, request, pk):
        from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
        from rest_framework.exceptions import PermissionDenied as DRFPermissionDenied

        estabelecimento = request.user.perfil_gestor.estabelecimento

        try:
            galeria = HistoricoGestorService.montar_galeria_os(pk, estabelecimento)
        except DjangoPermissionDenied:
            raise DRFPermissionDenied()

        ctx = {'request': request}
        return Response({
            'estado_inicial': MidiaGaleriaSerializer(galeria['estado_inicial'], many=True, context=ctx).data,
            'estado_meio':    MidiaGaleriaSerializer(galeria['estado_meio'],    many=True, context=ctx).data,
            'estado_final':   MidiaGaleriaSerializer(galeria['estado_final'],   many=True, context=ctx).data,
        })
