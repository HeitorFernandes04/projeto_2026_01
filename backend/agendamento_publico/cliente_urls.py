from django.urls import path

from .views import AuthB2CLoginView, AuthB2CSetupView, PainelClienteView


urlpatterns = [
    path('auth/setup/', AuthB2CSetupView.as_view(), name='auth-b2c-setup'),
    path('auth/token/', AuthB2CLoginView.as_view(), name='auth-b2c-token'),
    path('painel/', PainelClienteView.as_view(), name='cliente-painel'),
]
