from django.urls import path
from .views import (
    AtendimentoDetailView,
    AtendimentosHojeView,
    CriarAtendimentoView,
    FotoUploadView,
    IniciarAtendimentoView,
    FinalizarAtendimentoView,
    ServicoListView,
)

urlpatterns = [
    path('',              CriarAtendimentoView.as_view(),  name='atendimento-criar'),
    path('hoje/',         AtendimentosHojeView.as_view(),  name='atendimentos-hoje'),
    path('servicos/',     ServicoListView.as_view(),        name='servico-list'),
    path('<int:pk>/',     AtendimentoDetailView.as_view(), name='atendimento-detail'),
    path('<int:pk>/iniciar/', IniciarAtendimentoView.as_view(), name='atendimento-iniciar'),
    path('<int:pk>/finalizar/', FinalizarAtendimentoView.as_view(), name='atendimento-finalizar'),
    path('<int:pk>/fotos/',   FotoUploadView.as_view(),    name='atendimento-fotos'),
]
