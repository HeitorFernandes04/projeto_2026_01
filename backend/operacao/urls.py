# operacao/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrdensServicoHojeView, HistoricoOrdemServicoView,
    OrdemServicoDetailView, CriarOrdemServicoView,
    AvancarEtapaView, FinalizarIndustrialView,
    FotoUploadView, ServicoListView, HorariosLivresView,
    registrar_incidente, TagPecaViewSet
)

router = DefaultRouter()
router.register(r'tags-peca', TagPecaViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('novo/', CriarOrdemServicoView.as_view(), name='os-criar'),
    path('hoje/', OrdensServicoHojeView.as_view(), name='os-hoje'),
    path('historico/', HistoricoOrdemServicoView.as_view(), name='os-historico'),
    path('servicos/', ServicoListView.as_view(), name='servico-list'),
    path('horarios-livres/', HorariosLivresView.as_view(), name='horarios-livres'),
    path('<int:pk>/', OrdemServicoDetailView.as_view(), name='os-detail'),
    path('<int:pk>/fotos/', FotoUploadView.as_view(), name='os-fotos'),
    path('<int:pk>/avancar-etapa/', AvancarEtapaView.as_view(), name='os-avancar'),
    path('<int:pk>/finalizar/', FinalizarIndustrialView.as_view(), name='os-finalizar'),
    path('<int:pk>/incidente/', registrar_incidente, name='os-incidente'),
]
