from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle

from accounts.models import Estabelecimento
from .serializers import EstabelecimentoPublicoSerializer


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

    Segurança:
      - AllowAny: Acesso público, sem JWT.
      - Throttle: 60 req/min por IP (previne scraping — CA-05).
      - Lookup via slug (não expõe IDs sequenciais — evita IDOR reverso).
      - Serializer expõe apenas campos seguros (CA-03).
    """
    serializer_class = EstabelecimentoPublicoSerializer
    permission_classes = [AllowAny]
    throttle_classes = [EstabelecimentoPublicoRateThrottle]
    queryset = Estabelecimento.objects.filter(is_active=True)
    lookup_field = 'slug'
    # CA-01: Busca por slug na URL (RF-21.1)
    # Se o slug não existir ou o estabelecimento for inativo → 404 automático (CA-02)
