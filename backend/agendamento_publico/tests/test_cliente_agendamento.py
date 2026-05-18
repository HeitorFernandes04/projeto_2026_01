import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
import datetime

from operacao.tests.factories import (
    ClienteFactory,
    EstabelecimentoFactory,
    ServicoFactory,
    VeiculoFactory,
)

def _auth(client, user):
    from rest_framework_simplejwt.tokens import RefreshToken
    token = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(token.access_token)}')

@pytest.mark.django_db
class TestClienteAgendamentoAPI:
    def setup_method(self):
        self.api = APIClient()
        self.est = EstabelecimentoFactory(is_active=True)
        self.servico = ServicoFactory(estabelecimento=self.est, is_active=True, duracao_estimada_minutos=30)
        self.cliente = ClienteFactory()
        self.veiculo = VeiculoFactory(cliente=self.cliente)
        _auth(self.api, self.cliente.user)

    def test_criar_agendamento_sucesso(self):
        # Usar uma data no futuro
        amanha = timezone.now() + datetime.timedelta(days=1)
        data_hora_str = amanha.strftime('%Y-%m-%dT%H:%M:00')

        payload = {
            'slug': self.est.slug,
            'servico_id': self.servico.id,
            'veiculo_id': self.veiculo.id,
            'data_hora': data_hora_str,
        }

        resp = self.api.post('/api/cliente/agendamentos/', payload, format='json')
        assert resp.status_code == 201

    def test_criar_agendamento_data_retroativa_falha(self):
        # Usar uma data no passado
        ontem = timezone.now() - datetime.timedelta(days=1)
        data_hora_str = ontem.strftime('%Y-%m-%dT%H:%M:00')

        payload = {
            'slug': self.est.slug,
            'servico_id': self.servico.id,
            'veiculo_id': self.veiculo.id,
            'data_hora': data_hora_str,
        }

        resp = self.api.post('/api/cliente/agendamentos/', payload, format='json')
        assert resp.status_code == 400
        assert 'Não é possível agendar para uma data ou horário retroativo' in resp.data['detail']
