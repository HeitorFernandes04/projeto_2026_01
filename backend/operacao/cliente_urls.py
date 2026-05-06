from django.urls import path
from .views import ClienteHistoricoView

urlpatterns = [
    path('historico/', ClienteHistoricoView.as_view(), name='cliente-historico'),
]
