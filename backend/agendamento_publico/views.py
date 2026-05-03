from rest_framework.generics import RetrieveAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date

from accounts.models import Estabelecimento
from core.models import Servico
from .serializers import EstabelecimentoPublicoSerializer
from .services import DisponibilidadeService


class EstabelecimentoPublicoRateThrottle(AnonRateThrottle):
    """
    Define um escopo específico para o portal público.
    A taxa de 60/min será configurada via escopo 'publico' no settings ou fallback.
    """
    scope = 'publico'
    rate = '60/min'


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
