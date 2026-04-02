from django.urls import path
from .views import (
    AtendimentoDetailView,
    HistoricoAtendimentosView,
    AtendimentosHojeView,
    CriarAtendimentoView,
    FotoUploadView,
    IniciarAtendimentoView,
    FinalizarAtendimentoView,
    HorariosLivresView,
    ServicoListView,
)

urlpatterns = [
    path('',              CriarAtendimentoView.as_view(),  name='atendimento-criar'),
    path('historico/',    HistoricoAtendimentosView.as_view(), name='atendimentos-historico'),
    path('hoje/',         AtendimentosHojeView.as_view(),  name='atendimentos-hoje'),
    path('horarios-livres/', HorariosLivresView.as_view(), name='horarios-livres'),
    path('servicos/',     ServicoListView.as_view(),        name='servico-list'),
    path('<int:pk>/',     AtendimentoDetailView.as_view(), name='atendimento-detail'),
    path('<int:pk>/iniciar/', IniciarAtendimentoView.as_view(), name='atendimento-iniciar'),
    path('<int:pk>/finalizar/', FinalizarAtendimentoView.as_view(), name='atendimento-finalizar'),
    path('<int:pk>/fotos/',   FotoUploadView.as_view(),    name='atendimento-fotos'),
]
