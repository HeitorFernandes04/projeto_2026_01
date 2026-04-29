from django.urls import path

from operacao.views import IncidenteViewSet


urlpatterns = [
    path('pendentes/', IncidenteViewSet.as_view({'get': 'pendentes'}), name='incidentes-pendentes'),
    path('<int:pk>/auditoria/', IncidenteViewSet.as_view({'get': 'auditoria'}), name='incidentes-auditoria'),
    path('<int:pk>/resolver/', IncidenteViewSet.as_view({'patch': 'resolver'}), name='incidentes-resolver'),
]
