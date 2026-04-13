# atendimentos/urls.py
from django.urls import path
from .views import (
    AtendimentosHojeView, HistoricoAtendimentosView,
    AtendimentoDetailView, CriarAtendimentoView,
    AvancarEtapaView, FinalizarIndustrialView, # Novos endpoints
    FotoUploadView, ServicoListView, HorariosLivresView
)

urlpatterns = [
    path('', CriarAtendimentoView.as_view(), name='atendimento-criar'),
    path('hoje/', AtendimentosHojeView.as_view(), name='atendimentos-hoje'),
    path('historico/', HistoricoAtendimentosView.as_view(), name='atendimentos-historico'),
    path('servicos/', ServicoListView.as_view(), name='servico-list'),
    path('horarios-livres/', HorariosLivresView.as_view(), name='horarios-livres'),
    path('<int:pk>/', AtendimentoDetailView.as_view(), name='atendimento-detail'),
    path('<int:pk>/fotos/', FotoUploadView.as_view(), name='atendimento-fotos'),
    path('<int:pk>/avancar-etapa/', AvancarEtapaView.as_view(), name='atendimento-avancar'),
    path('<int:pk>/finalizar-industrial/', FinalizarIndustrialView.as_view(), name='atendimento-finalizar-industrial'),
]