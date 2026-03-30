from django.urls import path
from .views import AtendimentosHojeView

urlpatterns = [
    path('hoje/', AtendimentosHojeView.as_view(), name='atendimentos-hoje'),
]
