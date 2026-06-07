from rest_framework import generics, viewsets
from rest_framework.generics import RetrieveAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle
from django.core.exceptions import PermissionDenied, ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date

from accounts.models import Estabelecimento
from accounts.permissions import IsCliente
from core.models import Servico, Veiculo
from operacao.services import OrdemServicoService
from operacao.serializers import OrdemServicoSerializer
from .serializers import (
    AuthB2CLoginSerializer,
    AuthB2CSetupSerializer,
    AuthB2CWhatsAppSerializer,
    AuthB2CVerificacaoSerializer,
    EstabelecimentoPublicoSerializer,
    ClienteVeiculoSerializer,
    ClienteAgendamentoSerializer,
    EstabelecimentoMapaSerializer,
    CancelamentoSerializer,
)
from .services import AuthB2CService, DisponibilidadeService, CancelamentoService


class EstabelecimentoPublicoRateThrottle(AnonRateThrottle):
    """
    Define um escopo específico para o portal público.
    A taxa de 60/min será configurada via escopo 'publico' no settings ou fallback.
    """
    scope = 'publico'
    rate = '60/min'


class AuthB2CRateThrottle(AnonRateThrottle):
    scope = 'auth_b2c'
    rate = '100/min'


class OTPRequestRateThrottle(AnonRateThrottle):
    scope = 'otp_request'
    rate = '1/min'


class AuthB2CSetupView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthB2CRateThrottle]

    def post(self, request):
        serializer = AuthB2CSetupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            tokens = AuthB2CService.setup_cliente(**serializer.validated_data)
        except PermissionDenied as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except DjangoValidationError as exc:
            detail = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
            if 'ja possui PIN cadastrado' in detail:
                return Response({'detail': detail}, status=status.HTTP_409_CONFLICT)
            return Response({'detail': detail}, status=status.HTTP_400_BAD_REQUEST)

        return Response(tokens, status=status.HTTP_201_CREATED)


class AuthB2CLoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthB2CRateThrottle]

    def post(self, request):
        serializer = AuthB2CLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            tokens = AuthB2CService.login_cliente(**serializer.validated_data)
        except PermissionDenied as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_401_UNAUTHORIZED)

        return Response(tokens, status=status.HTTP_200_OK)


class AuthB2CWhatsAppView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [OTPRequestRateThrottle]

    def post(self, request):
        import logging
        logger = logging.getLogger('agendamento_publico')
        logger.info(f"AuthB2CWhatsAppView | Data: {request.data}")

        serializer = AuthB2CWhatsAppSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            res = AuthB2CService.solicitar_otp(**serializer.validated_data)
        except DjangoValidationError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(res, status=status.HTTP_200_OK)


from rest_framework_simplejwt.authentication import JWTAuthentication


class AuthB2CVerificacaoView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [JWTAuthentication]
    throttle_classes = [AuthB2CRateThrottle]

    def post(self, request):
        serializer = AuthB2CVerificacaoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        import logging
        logger = logging.getLogger('agendamento_publico')
        logger.info(f"AuthB2CVerificacaoView | User: {request.user} | Auth: {request.user.is_authenticated}")

        try:
            tokens = AuthB2CService.verificar_otp(
                **serializer.validated_data,
                current_user=request.user if request.user.is_authenticated else None
            )
        except DjangoValidationError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(tokens, status=status.HTTP_200_OK)


class PainelClienteView(APIView):
    """RF-25: Painel B2C filtrado por Veiculo.cliente, com reparo por telefone normalizado."""
    permission_classes = [IsCliente]

    def get(self, request):
        try:
            data = AuthB2CService.montar_painel_cliente(request.user)
        except PermissionDenied as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_403_FORBIDDEN)

        return Response(data, status=status.HTTP_200_OK)


class EstabelecimentoListaMapaView(generics.ListAPIView):
    """
    RF-28: GET /api/publico/estabelecimentos/
    Lista pública de estabelecimentos ativos com geolocalização para o mapa B2C.
    """
    serializer_class = EstabelecimentoMapaSerializer
    permission_classes = [AllowAny]
    throttle_classes = [EstabelecimentoPublicoRateThrottle]
    
    def get_queryset(self):
        qs = Estabelecimento.objects.filter(is_active=True)
        nota_minima = self.request.query_params.get('nota_minima')
        if nota_minima:
            try:
                valor = float(nota_minima)
                qs = qs.filter(avaliacao_media__gte=valor)
            except ValueError:
                pass
        return qs


class EstabelecimentoPublicoDetailView(RetrieveAPIView):
    """
    RF-21: Endpoint público (sem autenticação) que retorna os dados básicos
    de um Estabelecimento e seus serviços ativos via slug.
    """
    serializer_class = EstabelecimentoPublicoSerializer
    permission_classes = [AllowAny]
    throttle_classes = [EstabelecimentoPublicoRateThrottle]
    queryset = Estabelecimento.objects.filter(is_active=True)
    lookup_field = 'slug'


class DisponibilidadeView(APIView):
    """
    RF-22: Retorna horários disponíveis para agendamento.
    Consome o Motor de Disponibilidade para evitar overbooking.
    """
    permission_classes = [AllowAny]
    throttle_classes = [EstabelecimentoPublicoRateThrottle]

    def get(self, request):
        slug = request.query_params.get('slug')
        servico_id = request.query_params.get('servicoId')
        data_str = request.query_params.get('data')

        if not all([slug, servico_id, data_str]):
            return Response(
                {"detail": "Parâmetros 'slug', 'servicoId' e 'data' são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST
            )

        data_alvo = parse_date(data_str)
        if not data_alvo:
            return Response(
                {"detail": "Data inválida. Use YYYY-MM-DD."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        estabelecimento = get_object_or_404(Estabelecimento, slug=slug, is_active=True)
        servico = get_object_or_404(Servico, id=servico_id, estabelecimento=estabelecimento, is_active=True)

        horarios = DisponibilidadeService.calcular_horarios_livres(estabelecimento, servico, data_alvo)
        
        return Response(horarios, status=status.HTTP_200_OK)


class CancelamentoView(APIView):
    """
    RF-24: PATCH /api/publico/agendamento/ordens-servico/{slug}/cancelar/
    Endpoint público — cliente cancela agendamento via UUID (RF-24.3).
    RNF-03: Resposta mínima, sem dados sensíveis do estabelecimento ou funcionários.
    """
    permission_classes = [AllowAny]
    throttle_classes = [EstabelecimentoPublicoRateThrottle]

    def patch(self, request, slug):
        serializer = CancelamentoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            CancelamentoService.cancelar_por_slug(
                slug=slug,
                motivo=serializer.validated_data.get('motivo_cancelamento', ''),
            )
        except PermissionError as e:
            # RF-24.1: status já iniciado → 403
            return Response({'detail': str(e)}, status=status.HTTP_403_FORBIDDEN)
        except DjangoValidationError as e:
            # RF-24.2: antecedência insuficiente / slug não encontrado → 400
            detail = e.messages[0] if hasattr(e, 'messages') else str(e)
            return Response({'detail': detail}, status=status.HTTP_400_BAD_REQUEST)

        # RNF-03: resposta mínima, sem expor dados internos
        return Response(
            {'detail': 'Agendamento cancelado com sucesso.'},
            status=status.HTTP_200_OK,
        )


class ClienteVeiculoViewSet(viewsets.ModelViewSet):
    permission_classes = [IsCliente]
    serializer_class = ClienteVeiculoSerializer

    def get_queryset(self):
        return Veiculo.objects.filter(cliente=self.request.user.perfil_cliente)

    def perform_create(self, serializer):
        slug = self.request.data.get('estabelecimento_slug')
        if not slug:
            # Fallback para o primeiro estabelecimento ativo se criado avulso (Axioma B2C)
            est = Estabelecimento.objects.filter(is_active=True).first()
            if not est:
                raise DRFValidationError({'estabelecimento_slug': 'Nenhum estabelecimento ativo disponível.'})
        else:
            est = get_object_or_404(Estabelecimento, slug=slug)
        
        serializer.save(cliente=self.request.user.perfil_cliente, estabelecimento=est)



class ClienteAgendamentoView(APIView):
    permission_classes = [IsCliente]

    def post(self, request):
        serializer = ClienteAgendamentoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            os = OrdemServicoService.criar_agendamento_cliente(
                dados=serializer.validated_data,
                cliente=request.user.perfil_cliente
            )
            return Response(OrdemServicoSerializer(os, context={'request': request}).data, status=status.HTTP_201_CREATED)
        except DjangoValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ClientePerfilView(APIView):
    permission_classes = [IsCliente]

    def get(self, request):
        user = request.user
        cliente = user.perfil_cliente
        return Response({
            'id': user.id,
            'nome': user.name,
            'email': user.email,
            'telefone': cliente.telefone_whatsapp,
            'membro_desde': user.date_joined,
        })

    def patch(self, request):
        user = request.user
        
        nome = request.data.get('nome')
        if nome:
            user.name = nome
            user.save()
            
        cliente = user.perfil_cliente
        return Response({
            'id': user.id,
            'nome': user.name,
            'email': user.email,
            'telefone': cliente.telefone_whatsapp,
            'membro_desde': user.date_joined,
        })

