import pytest
from django.urls import reverse
from rest_framework.exceptions import Throttled
from rest_framework.test import APIClient
from rest_framework.views import APIView
from unittest.mock import patch

from accounts.models import User
from agendamento_publico.services import AuthB2CService
from operacao.tests.factories import EstabelecimentoFactory, OrdemServicoFactory, VeiculoFactory


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def veiculo_cliente(db):
    estabelecimento = EstabelecimentoFactory()
    return VeiculoFactory(
        estabelecimento=estabelecimento,
        placa='ABC1234',
        nome_dono='Cliente Teste',
        celular_dono='11999999999',
    )


@pytest.mark.django_db
class TestAuthB2CAPI:
    def test_setup_primeiro_acesso_retorna_201_e_tokens(self, api_client, veiculo_cliente):
        response = api_client.post(
            reverse('auth-b2c-setup'),
            {
                'telefone': '11999999999',
                'placa': 'ABC1234',
                'pin': '1234',
            },
            format='json',
        )

        assert response.status_code == 201
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert User.objects.filter(username='b2c_11999999999').exists()

    def test_login_com_credenciais_validas_retorna_200_e_tokens(self, api_client, veiculo_cliente):
        AuthB2CService.setup_cliente('11999999999', 'ABC1234', '1234')

        response = api_client.post(
            reverse('auth-b2c-token'),
            {
                'telefone': '11999999999',
                'pin': '1234',
            },
            format='json',
        )

        assert response.status_code == 200
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_setup_combinacao_placa_telefone_invalida_retorna_404(self, api_client, db):
        estabelecimento = EstabelecimentoFactory()
        VeiculoFactory(
            estabelecimento=estabelecimento,
            placa='AAA1111',
            celular_dono='11911111111',
        )
        VeiculoFactory(
            estabelecimento=estabelecimento,
            placa='BBB2222',
            celular_dono='11922222222',
        )

        response = api_client.post(
            reverse('auth-b2c-setup'),
            {
                'telefone': '11911111111',
                'placa': 'BBB2222',
                'pin': '1234',
            },
            format='json',
        )

        assert response.status_code == 404
        assert not User.objects.filter(username='b2c_11911111111').exists()

    def test_setup_repetido_retorna_409_sem_alterar_senha(self, api_client, veiculo_cliente):
        AuthB2CService.setup_cliente('11999999999', 'ABC1234', '1234')

        response = api_client.post(
            reverse('auth-b2c-setup'),
            {
                'telefone': '11999999999',
                'placa': 'ABC1234',
                'pin': '9999',
            },
            format='json',
        )

        user = User.objects.get(username='b2c_11999999999')
        assert response.status_code == 409
        assert user.check_password('1234')
        assert not user.check_password('9999')

    def test_login_pin_incorreto_retorna_401(self, api_client, veiculo_cliente):
        AuthB2CService.setup_cliente('11999999999', 'ABC1234', '1234')

        response = api_client.post(
            reverse('auth-b2c-token'),
            {
                'telefone': '11999999999',
                'pin': '9999',
            },
            format='json',
        )

        assert response.status_code == 401

    def test_rate_limiting_retorna_429(self, api_client, veiculo_cliente):
        with patch.object(APIView, 'check_throttles', side_effect=Throttled()):
            response = api_client.post(
                reverse('auth-b2c-token'),
                {
                    'telefone': '11999999999',
                    'pin': '9999',
                },
                format='json',
            )

        assert response.status_code == 429

    def test_painel_cliente_retorna_apenas_ordens_do_cliente_autenticado(self, api_client, veiculo_cliente):
        AuthB2CService.setup_cliente('11999999999', 'ABC1234', '1234')
        cliente_user = User.objects.get(username='b2c_11999999999')
        OrdemServicoFactory(
            estabelecimento=veiculo_cliente.estabelecimento,
            veiculo=veiculo_cliente,
            funcionario=None,
            status='PATIO',
        )
        outro_veiculo = VeiculoFactory(
            estabelecimento=veiculo_cliente.estabelecimento,
            placa='ZZZ9999',
            celular_dono='11888888888',
        )
        OrdemServicoFactory(
            estabelecimento=veiculo_cliente.estabelecimento,
            veiculo=outro_veiculo,
            funcionario=None,
            status='PATIO',
        )
        api_client.force_authenticate(user=cliente_user)

        response = api_client.get(reverse('cliente-painel'))

        assert response.status_code == 200
        assert len(response.data['ativos']) == 1
        assert response.data['ativos'][0]['placa'] == 'ABC1234'
