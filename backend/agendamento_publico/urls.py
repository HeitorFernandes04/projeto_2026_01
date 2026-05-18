from django.urls import path
from .views import (
    EstabelecimentoPublicoDetailView,
    EstabelecimentoListaMapaView,
    DisponibilidadeView,
    CancelamentoView,
    AuthB2CSetupView,
    AuthB2CLoginView,
    PainelClienteView,
)

urlpatterns = [
    # RF-28: GET /api/publico/estabelecimentos/ — lista para mapa B2C
    path(
        'estabelecimentos/',
        EstabelecimentoListaMapaView.as_view(),
        name='estabelecimentos-mapa'
    ),
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
    # RF-25: Auth B2C
    path('auth/setup/', AuthB2CSetupView.as_view(), name='auth-b2c-setup'),
    path('auth/login/', AuthB2CLoginView.as_view(), name='auth-b2c-login'),
    # RF-25: Painel do cliente
    path('historico/', PainelClienteView.as_view(), name='painel-cliente'),
]
