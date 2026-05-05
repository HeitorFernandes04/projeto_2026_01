from rest_framework.generics import RetrieveAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle
from django.core.exceptions import PermissionDenied, ValidationError
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date

from accounts.models import Estabelecimento
from core.models import Servico
from accounts.permissions import IsCliente
from .serializers import (
    AuthB2CLoginSerializer,
    AuthB2CSetupSerializer,
    EstabelecimentoPublicoSerializer,
)
from .services import AuthB2CService, DisponibilidadeService


class EstabelecimentoPublicoRateThrottle(AnonRateThrottle):
    """
    Define um escopo específico para o portal público.
    A taxa de 60/min será configurada via escopo 'publico' no settings ou fallback.
    """
    scope = 'publico'
    rate = '60/min'


class AuthB2CRateThrottle(AnonRateThrottle):
    scope = 'auth_b2c'
    rate = '5/hour'


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
        except ValidationError as exc:
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


class PainelClienteView(APIView):
    permission_classes = [IsCliente]

    def get(self, request):
        try:
            data = AuthB2CService.montar_painel_cliente(request.user)
        except PermissionDenied as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_403_FORBIDDEN)

        return Response(data, status=status.HTTP_200_OK)


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
