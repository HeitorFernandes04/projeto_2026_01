from django.urls import path
from .views import ClienteGaleriaView, ClienteHistoricoView

urlpatterns = [
    path('historico/', ClienteHistoricoView.as_view(), name='cliente-historico'),
    path(
        'historico/<int:pk>/galeria/',
        ClienteGaleriaView.as_view(),
        name='cliente-historico-galeria',
    ),
]
