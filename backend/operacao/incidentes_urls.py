from django.urls import path

from .views import IncidenteViewSet


urlpatterns = [
    path(
        'pendentes/',
        IncidenteViewSet.as_view({'get': 'pendentes'}),
        name='incidentes-os-pendentes',
    ),
    path(
        '<int:pk>/auditoria/',
        IncidenteViewSet.as_view({'get': 'auditoria'}),
        name='incidentes-os-auditoria',
    ),
    path(
        '<int:pk>/resolver/',
        IncidenteViewSet.as_view({'patch': 'resolver'}),
        name='incidentes-os-resolver',
    ),
]
