from django.urls import path
from .views import EstabelecimentoPublicoDetailView, DisponibilidadeView, CancelamentoView

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
    # RF-24: PATCH /api/publico/agendamento/ordens-servico/{slug_uuid}/cancelar/
    path(
        'agendamento/ordens-servico/<uuid:slug>/cancelar/',
        CancelamentoView.as_view(),
        name='cancelamento-autonomo'
    ),
]
