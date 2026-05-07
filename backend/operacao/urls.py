# operacao/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CheckoutPublicoView, OrdensServicoHojeView, HistoricoOrdemServicoView,
    OrdemServicoDetailView, CriarOrdemServicoView,
    AvancarEtapaView, FinalizarIndustrialView,
    FotoUploadView, ServicoListView, HorariosLivresView,
    registrar_incidente, TagPecaViewSet, KanbanAPIView,
    HistoricoGestorListView, HistoricoGestorFotosView,
    EntradasRecentesAPIView,
)

router = DefaultRouter()
router.register(r'tags-peca', TagPecaViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Rotas fixas do gestor (devem vir antes dos padrões com <int:pk>)
    path('gestor/historico/', HistoricoGestorListView.as_view(), name='gestor-historico'),
    path('gestor/historico/<int:pk>/fotos/', HistoricoGestorFotosView.as_view(), name='gestor-historico-fotos'),
    path('kanban/', KanbanAPIView.as_view(), name='os-kanban'),
    path('entradas-recentes/', EntradasRecentesAPIView.as_view(), name='os-entradas-recentes'),
    path('novo/', CriarOrdemServicoView.as_view(), name='os-criar'),
    path('hoje/', OrdensServicoHojeView.as_view(), name='os-hoje'),
    path('historico/', HistoricoOrdemServicoView.as_view(), name='os-historico'),
    path('servicos/', ServicoListView.as_view(), name='servico-list'),
    path('horarios-livres/', HorariosLivresView.as_view(), name='horarios-livres'),
    path('publico/agendamento/checkout/', CheckoutPublicoView.as_view(), name='checkout-publico'),
    path('<int:pk>/', OrdemServicoDetailView.as_view(), name='os-detail'),
    path('<int:pk>/fotos/', FotoUploadView.as_view(), name='os-fotos'),
    path('<int:pk>/avancar-etapa/', AvancarEtapaView.as_view(), name='os-avancar'),
    path('<int:pk>/finalizar/', FinalizarIndustrialView.as_view(), name='os-finalizar'),
    path('<int:pk>/incidente/', registrar_incidente, name='os-incidente'),
]
