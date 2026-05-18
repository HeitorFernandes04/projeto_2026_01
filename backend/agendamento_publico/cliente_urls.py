from django.urls import path, include
from rest_framework import routers
from .views import AuthB2CLoginView, AuthB2CSetupView, PainelClienteView, ClienteVeiculoViewSet, ClienteAgendamentoView, ClientePerfilView

router = routers.DefaultRouter()
router.register(r'veiculos', ClienteVeiculoViewSet, basename='cliente-veiculos')

urlpatterns = [
    path('auth/setup/', AuthB2CSetupView.as_view(), name='auth-b2c-setup'),
    path('auth/token/', AuthB2CLoginView.as_view(), name='auth-b2c-token'),
    path('painel/', PainelClienteView.as_view(), name='cliente-painel'),
    path('agendamentos/', ClienteAgendamentoView.as_view(), name='cliente-agendamentos'),
    path('perfil/', ClientePerfilView.as_view(), name='cliente-perfil'),
    path('', include(router.urls)),
]


