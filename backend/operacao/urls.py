from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AvancarEtapaView,
    CheckoutPublicoView,
    CriarOrdemServicoView,
    EntradasRecentesAPIView,
    FinalizarIndustrialView,
    FotoUploadView,
    HorariosLivresView,
    KanbanAPIView,
    OrdemServicoDetailView,
    OrdensServicoHojeView,
    ServicoListView,
    TagPecaViewSet,
    registrar_incidente,
    PausarOrdemServicoView,
    RetomarOrdemServicoView,
)


router = DefaultRouter()
router.register(r'tags-peca', TagPecaViewSet)


urlpatterns = [
    path('', include(router.urls)),
    path('kanban/', KanbanAPIView.as_view(), name='os-kanban'),
    path('entradas-recentes/', EntradasRecentesAPIView.as_view(), name='os-entradas-recentes'),
    path('novo/', CriarOrdemServicoView.as_view(), name='os-criar'),
    path('hoje/', OrdensServicoHojeView.as_view(), name='os-hoje'),
    path('servicos/', ServicoListView.as_view(), name='servico-list'),
    path('horarios-livres/', HorariosLivresView.as_view(), name='horarios-livres'),
    path('publico/agendamento/checkout/', CheckoutPublicoView.as_view(), name='checkout-publico'),
    path('<int:pk>/', OrdemServicoDetailView.as_view(), name='os-detail'),
    path('<int:pk>/fotos/', FotoUploadView.as_view(), name='os-fotos'),
    path('<int:pk>/avancar-etapa/', AvancarEtapaView.as_view(), name='os-avancar'),
    path('<int:pk>/finalizar/', FinalizarIndustrialView.as_view(), name='os-finalizar'),
    path('<int:pk>/incidente/', registrar_incidente, name='os-incidente'),
    path('<int:pk>/pausar/', PausarOrdemServicoView.as_view(), name='os-pausar'),
    path('<int:pk>/retomar/', RetomarOrdemServicoView.as_view(), name='os-retomar'),
]
