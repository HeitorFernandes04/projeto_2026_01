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

from .permissions import IsFuncionarioDaOS, IsGestorOperacao
from .serializers import (
    OrdemServicoSerializer,
    CriarOrdemServicoSerializer,
    HistoricoOrdemServicoFiltroSerializer,
    MidiaOrdemServicoSerializer,
    MidiaOrdemServicoUploadSerializer,
    ServicoSerializer,
    ProximaEtapaSerializer,
    FinalizarIndustrialSerializer,
    ResolverIncidenteSerializer,
)
from .services import OrdemServicoService, MidiaOrdemServicoService


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


class TagPecaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TagPeca.objects.all()
    serializer_class = TagPecaSerializer


class IncidenteViewSet(viewsets.ViewSet):
    """RF-15/RF-16: Central, auditoria e desbloqueio de incidentes pelo gestor."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsGestorOperacao]

    def pendentes(self, request):
        incidentes = IncidenteService.listar_pendentes(
            gestor=request.user,
            estabelecimento_id=request.query_params.get('estabelecimento_id'),
        )
        serializer = IncidenteOSSerializer(incidentes, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def auditoria(self, request, pk=None):
        incidente = IncidenteService.obter_auditoria(request.user, pk)
        serializer = IncidenteOSSerializer(incidente, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def resolver(self, request, pk=None):
        serializer = ResolverIncidenteSerializer(data=request.data)
        if not serializer.is_valid():
            erro = serializer.errors.get('nota_resolucao', ['A nota de resolução é obrigatória.'])[0]
            return Response({'detail': str(erro)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            incidente = IncidenteService.resolver_incidente(
                gestor=request.user,
                incidente_id=pk,
                nota_resolucao=serializer.validated_data['nota_resolucao'],
            )
        except ValidationError as exc:
            detalhe = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
            return Response({'detail': detalhe}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_409_CONFLICT)

        serializer_saida = IncidenteOSSerializer(incidente, context={'request': request})
        return Response(serializer_saida.data, status=status.HTTP_200_OK)


@api_view(['POST'])
def registrar_incidente(request, pk):
    """Endpoint para o operador relatar um dano e travar a OS."""
    try:
        incidente = IncidenteService.registrar_incidente(
            os_id=pk,
            dados=request.data,
            arquivo_foto=request.FILES.get('foto_url')
        )
        return Response({'status': 'OS bloqueada por incidente'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
