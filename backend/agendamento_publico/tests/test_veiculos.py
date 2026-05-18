import pytest
import re
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from accounts.models import Cliente, User, Estabelecimento
from core.models import Veiculo
from django.core.exceptions import ValidationError

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def setup_data():
    # Criar usuários e clientes
    user1 = User.objects.create_user(username='user1', email='u1@test.com', password='pin')
    cliente1 = Cliente.objects.create(user=user1, telefone_whatsapp='11999999991')
    
    user2 = User.objects.create_user(username='user2', email='u2@test.com', password='pin')
    cliente2 = Cliente.objects.create(user=user2, telefone_whatsapp='11999999992')
    
    # Criar estabelecimento
    est = Estabelecimento.objects.create(nome_fantasia='Lava Car', slug='lava-car')
    
    # Criar veículos
    v1 = Veiculo.objects.create(cliente=cliente1, estabelecimento=est, placa='AAA1234', modelo='Gol', marca='VW', cor='PRETO')
    v2 = Veiculo.objects.create(cliente=cliente2, estabelecimento=est, placa='BBB1234', modelo='Palio', marca='Fiat', cor='BRANCO')
    
    return {
        'u1': user1, 'c1': cliente1, 'v1': v1,
        'u2': user2, 'c2': cliente2, 'v2': v2,
        'est': est
    }

@pytest.mark.django_db
def test_listar_veiculos_apenas_do_cliente(api_client, setup_data):
    """1. Garanta que o QuerySet filtra os dados isolando inquilinos."""
    api_client.force_authenticate(user=setup_data['u1'])
    url = reverse('cliente-veiculos-list')
    
    response = api_client.get(url)
    
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]['placa'] == 'AAA1234'

@pytest.mark.django_db
def test_salvar_veiculo_com_cor_invalida(api_client, setup_data):
    """2. Valide o disparo de erro caso uma cor fora do dicionário seja enviada."""
    api_client.force_authenticate(user=setup_data['u1'])
    url = reverse('cliente-veiculos-list')
    
    data = {
        'placa': 'CCC1234',
        'modelo': 'Uno',
        'marca': 'Fiat',
        'cor': 'AZUL_BEBE', # Inválida!
        'estabelecimento_slug': 'lava-car'
    }
    
    response = api_client.post(url, data)
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert 'cor' in response.data

@pytest.mark.django_db
def test_atualizar_veiculo_titularidade_cruzada(api_client, setup_data):
    """3. Tente atualizar um veículo de outro User ID e garanta o retorno de erro HTTP 403 ou 404."""
    api_client.force_authenticate(user=setup_data['u1'])
    # Tenta atualizar o veículo do user2 (v2)
    url = reverse('cliente-veiculos-detail', kwargs={'pk': setup_data['v2'].id})
    
    data = {
        'modelo': 'Palio Atualizado'
    }
    
    response = api_client.patch(url, data)
    
    # Deve retornar 404 porque o get_queryset filtra por cliente!
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_salvar_veiculo_sem_slug_usa_fallback(api_client, setup_data):
    """4. Valide que se o estabelecimento_slug não for enviado, ele usa o primeiro ativo."""
    api_client.force_authenticate(user=setup_data['u1'])
    url = reverse('cliente-veiculos-list')
    
    # Garantir que o estabelecimento está ativo
    setup_data['est'].is_active = True
    setup_data['est'].save()
    
    data = {
        'placa': 'DDD1234',
        'modelo': 'Celta',
        'marca': 'Chevrolet',
        'cor': 'PRETO'
    }
    
    response = api_client.post(url, data)
    
    assert response.status_code == status.HTTP_201_CREATED
    assert response.data['placa'] == 'DDD1234'
    
    # Verifica se salvou com o estabelecimento
    veiculo = Veiculo.objects.get(placa='DDD1234')
    assert veiculo.estabelecimento == setup_data['est']

