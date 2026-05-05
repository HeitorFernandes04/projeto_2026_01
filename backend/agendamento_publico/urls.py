from django.urls import path
from .views import (
    DisponibilidadeView,
    EstabelecimentoPublicoDetailView,
)

urlpatterns = [
    # RF-21: GET /api/publico/estabelecimento/{slug}/
    path(
        'estabelecimento/<slug:slug>/',
        EstabelecimentoPublicoDetailView.as_view(),
        name='estabelecimento-publico-detail'
    ),
    # RF-22: GET /api/publico/agendamento/disponibilidade/
    path(
        'agendamento/disponibilidade/',
        DisponibilidadeView.as_view(),
        name='disponibilidade-horarios'
    ),
]
