from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'servicos', views.ServicoViewSet, basename='servico')

app_name = 'core'

urlpatterns = [
    path('', include(router.urls)), # Serviços
    path('tags-peca/', views.TagPecaListView.as_view(), name='tag-peca-list'),
    path('estabelecimento/', views.GestaoViewSet.as_view({'get': 'estabelecimento', 'patch': 'estabelecimento'}), name='gestao-estabelecimento'),
]