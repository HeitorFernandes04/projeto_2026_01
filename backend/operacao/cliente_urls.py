from django.urls import path
from .views import OrdemServicoAvaliarView

urlpatterns = [
    path('<int:pk>/avaliar/', OrdemServicoAvaliarView.as_view(), name='cliente-os-avaliar'),
]
