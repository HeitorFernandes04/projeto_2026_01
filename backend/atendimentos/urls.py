# atendimentos/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AtendimentosHojeView, HistoricoAtendimentosView,
    AtendimentoDetailView, CriarAtendimentoView,
    AvancarEtapaView, FinalizarIndustrialView,
    FotoUploadView, ServicoListView, HorariosLivresView, 
    registrar_incidente, TagPecaViewSet # Adicionado TagPecaViewSet
)

router = DefaultRouter()
router.register(r'tags-peca', TagPecaViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('novo/', CriarAtendimentoView.as_view(), name='atendimento-criar'),
    path('hoje/', AtendimentosHojeView.as_view(), name='atendimentos-hoje'),
    path('historico/', HistoricoAtendimentosView.as_view(), name='atendimentos-historico'),
    path('servicos/', ServicoListView.as_view(), name='servico-list'),
    path('horarios-livres/', HorariosLivresView.as_view(), name='horarios-livres'),
    path('<int:pk>/', AtendimentoDetailView.as_view(), name='atendimento-detail'),
    path('<int:pk>/fotos/', FotoUploadView.as_view(), name='atendimento-fotos'),
    path('<int:pk>/avancar-etapa/', AvancarEtapaView.as_view(), name='atendimento-avancar'),
    path('<int:pk>/finalizar-industrial/', FinalizarIndustrialView.as_view(), name='atendimento-finalizar-industrial'),
    path('<int:pk>/incidente/', registrar_incidente, name='atendimento-incidente'),
]