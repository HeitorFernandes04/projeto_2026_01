from django.urls import path

from .views import AtendimentosHojeView, FotoUploadView

urlpatterns = [
    path('hoje/', AtendimentosHojeView.as_view(), name='atendimentos-hoje'),
    path('<int:pk>/fotos/', FotoUploadView.as_view(), name='atendimento-fotos'),
]
