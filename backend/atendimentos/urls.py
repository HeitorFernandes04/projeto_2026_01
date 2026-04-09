# atendimentos/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AtendimentosHojeView, CriarAtendimentoView, HistoricoAtendimentosView,
    ServicoListView, AtendimentoDetailView, IniciarAtendimentoView,
    FotoUploadView, AdicionarComentarioView, HorariosLivresView
)
from .viewsets import AtendimentoViewSet, OrdemServicoViewSet

router = DefaultRouter()
router.register(r'ordens-servico', OrdemServicoViewSet, basename='ordem-servico')
# O prefixo vazio garante que as rotas do ViewSet fiquem em /api/atendimentos/
router.register(r'', AtendimentoViewSet, basename='atendimento-vset')

urlpatterns = [
    # Rotas fixas primeiro para evitar conflitos
    path('hoje/', AtendimentosHojeView.as_view(), name='atendimentos-hoje'),
    path('historico/', HistoricoAtendimentosView.as_view(), name='atendimentos-historico'),
    path('servicos/', ServicoListView.as_view(), name='servico-list'),
    path('horarios-livres/', HorariosLivresView.as_view(), name='horarios-livres'),
    
    # Rotas com ID
    path('<int:pk>/iniciar/', IniciarAtendimentoView.as_view(), name='atendimento-iniciar'),
    path('<int:pk>/fotos/', FotoUploadView.as_view(), name='atendimento-fotos'),
    path('<int:pk>/comentario/', AdicionarComentarioView.as_view(), name='atendimento-comentario'),
    path('<int:pk>/', AtendimentoDetailView.as_view(), name='atendimento-detail'),

    # Router por último
    path('', include(router.urls)),
]