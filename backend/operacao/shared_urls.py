from django.urls import path

from operacao.views import HistoricoGaleriaUnificadaView, HistoricoUnificadoView


urlpatterns = [
    path('historico/', HistoricoUnificadoView.as_view(), name='shared-historico'),
    path(
        'historico/<int:pk>/galeria/',
        HistoricoGaleriaUnificadaView.as_view(),
        name='shared-historico-galeria',
    ),
]
