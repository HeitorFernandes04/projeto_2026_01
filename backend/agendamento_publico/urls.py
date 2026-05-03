from django.urls import path
from .views import EstabelecimentoPublicoDetailView

urlpatterns = [
    # RF-21: GET /api/publico/estabelecimento/{slug}/
    # Endpoint público sem autenticação — lookup por slug amigável
    path(
        'estabelecimento/<slug:slug>/',
        EstabelecimentoPublicoDetailView.as_view(),
        name='estabelecimento-publico-detail'
    ),
]
