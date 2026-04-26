from django.urls import path

from operacao.views import IncidenteViewSet


urlpatterns = [
    path('pendentes/', IncidenteViewSet.as_view({'get': 'pendentes'}), name='incidentes-pendentes'),
]
