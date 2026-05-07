from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'servicos', views.ServicoViewSet, basename='servico')
router.register(r'tags-peca', views.TagPecaViewSet, basename='tag-peca')

app_name = 'core'

urlpatterns = [
    path('', include(router.urls)), 
    path('estabelecimento/', views.GestaoViewSet.as_view({'get': 'estabelecimento', 'patch': 'estabelecimento'}), name='gestao-estabelecimento'),
    path('funcionarios/', views.GestaoViewSet.as_view({'get': 'funcionarios', 'post': 'funcionarios'}), name='gestao-funcionarios-list'),
    path('funcionarios/<int:pk>/', views.GestaoViewSet.as_view({'patch': 'funcionarios_detalhe'}), name='gestao-funcionarios-detail'),
    path('gestor/dashboard/indicadores/', views.DashboardAPIView.as_view(), name='dashboard-indicadores'),
    path('gestor/dashboard/eficiencia-equipe/', views.EficienciaAPIView.as_view(), name='dashboard-eficiencia-equipe'),
]