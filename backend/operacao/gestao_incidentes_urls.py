from django.urls import path

from operacao.views import IncidenteComparativoView


urlpatterns = [
    path('<int:pk>/comparativo/', IncidenteComparativoView.as_view(), name='gestao-incidente-comparativo'),
]
