from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView
from .views import RegisterView, meu_perfil, EstabelecimentoMeView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('meu_perfil/', meu_perfil, name='meu-perfil'),
    path('estabelecimento/me/', EstabelecimentoMeView.as_view(), name='estabelecimento-me'),
]