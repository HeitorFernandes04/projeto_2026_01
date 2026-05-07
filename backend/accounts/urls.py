from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView
from .views import RegisterView, RegistroClienteView, meu_perfil, EstabelecimentoMeView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('registro-cliente/', RegistroClienteView.as_view(), name='registro-cliente'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('meu_perfil/', meu_perfil, name='meu-perfil'),
    path('estabelecimento/me/', EstabelecimentoMeView.as_view(), name='estabelecimento-me'),
]