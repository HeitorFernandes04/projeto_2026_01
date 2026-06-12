import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from accounts.models import Estabelecimento, Cliente, User
from operacao.models import OrdemServico, Veiculo, Servico

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def base_data(db):
    user_cliente = User.objects.create(username='cliente1', email='c1@test.com')
    cliente = Cliente.objects.create(user=user_cliente, telefone_whatsapp='11999999999')

    user_gestor = User.objects.create(username='gestor1', email='g1@test.com')
    estabelecimento = Estabelecimento.objects.create(nome_fantasia='Lava Bem')

    servico = Servico.objects.create(
        estabelecimento=estabelecimento,
        nome='Lavagem Simples',
        duracao_estimada_minutos=30,
        preco=30.00
    )

    veiculo = Veiculo.objects.create(
        estabelecimento=estabelecimento,
        cliente=cliente,
        placa='ABC1234',
        celular_dono='11999999999'
    )

    ordem = OrdemServico.objects.create(
        estabelecimento=estabelecimento,
        veiculo=veiculo,
        servico=servico,
        status='FINALIZADO'
    )

    return {
        'cliente': cliente,
        'user_cliente': user_cliente,
        'estabelecimento': estabelecimento,
        'veiculo': veiculo,
        'ordem': ordem
    }

@pytest.mark.django_db
class TestAvaliacaoAPI:
    def test_cliente_pode_avaliar_ordem_finalizada(self, api_client, base_data):
        api_client.force_authenticate(user=base_data['user_cliente'])
        url = reverse('cliente-os-avaliar', kwargs={'pk': base_data['ordem'].id})
        
        response = api_client.post(url, {'estrelas': 5}, format='json')
        
        assert response.status_code == 200
        
        base_data['ordem'].refresh_from_db()
        assert base_data['ordem'].avaliacao_estrelas == 5
        
        # Testar se a média do estabelecimento foi atualizada pelo signal
        base_data['estabelecimento'].refresh_from_db()
        assert base_data['estabelecimento'].avaliacao_media == 5.0

    def test_avaliacao_invalida_retorna_400(self, api_client, base_data):
        api_client.force_authenticate(user=base_data['user_cliente'])
        url = reverse('cliente-os-avaliar', kwargs={'pk': base_data['ordem'].id})
        
        response = api_client.post(url, {'estrelas': 6}, format='json')
        assert response.status_code == 400
        
        response = api_client.post(url, {'estrelas': 'abc'}, format='json')
        assert response.status_code == 400

    def test_apenas_ordem_finalizada_pode_ser_avaliada(self, api_client, base_data):
        base_data['ordem'].status = 'EM_EXECUCAO'
        base_data['ordem'].save()
        
        api_client.force_authenticate(user=base_data['user_cliente'])
        url = reverse('cliente-os-avaliar', kwargs={'pk': base_data['ordem'].id})
        
        response = api_client.post(url, {'estrelas': 4}, format='json')
        assert response.status_code == 400
        assert "finalizadas" in response.data['detail']

    def test_apenas_cliente_dono_pode_avaliar(self, api_client, base_data, db):
        outro_user = User.objects.create(username='outro', email='outro@test.com')
        Cliente.objects.create(user=outro_user, telefone_whatsapp='11888888888')
        
        api_client.force_authenticate(user=outro_user)
        url = reverse('cliente-os-avaliar', kwargs={'pk': base_data['ordem'].id})
        
        response = api_client.post(url, {'estrelas': 4}, format='json')
        assert response.status_code == 403
