from django.urls import path
from .views import EstabelecimentoPublicoDetailView
from operacao.views import GaleriaClienteView

urlpatterns = [
    # RF-21: GET /api/publico/estabelecimento/{slug}/
    # Endpoint público sem autenticação — lookup por slug amigável
    path(
        'estabelecimento/<slug:slug>/',
        EstabelecimentoPublicoDetailView.as_view(),
        name='estabelecimento-publico-detail'
    ),
    # RF-26: GET /api/publico/galeria/<id>/
    path(
        'galeria/<int:pk>/',
        GaleriaClienteView.as_view(),
        name='galeria-cliente'
    ),
]
