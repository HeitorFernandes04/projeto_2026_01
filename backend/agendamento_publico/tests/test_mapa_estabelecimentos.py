"""
Testes TDD — RF-28: Endpoint público de listagem de estabelecimentos para o mapa B2C.
GET /api/publico/estabelecimentos/

Cenários cobertos:
1. Lista apenas estabelecimentos com is_active=True
2. Estabelecimento inativo não aparece na lista
3. Resposta inclui os campos obrigatórios do mapa (lat, long, slug, logo, endereço)
4. Endpoint não exige autenticação (AllowAny)
5. Estabelecimento sem lat/long retorna null nos campos (não quebra)
"""
import pytest
from rest_framework.test import APIClient
from accounts.models import Estabelecimento


URL = '/api/publico/estabelecimentos/'


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def estabelecimento_ativo(db):
    return Estabelecimento.objects.create(
        nome_fantasia="Lava-Me Centro",
        cnpj="11111111111111",
        endereco_completo="Av. Palmas, 100 - Plano Diretor Sul",
        is_active=True,
        slug="lava-me-centro",
        latitude=-10.184,
        longitude=-48.334,
    )


@pytest.fixture
def estabelecimento_sem_geolocalizacao(db):
    return Estabelecimento.objects.create(
        nome_fantasia="Lava-Me Norte",
        cnpj="22222222222222",
        endereco_completo="Av. NS-10, 50",
        is_active=True,
        slug="lava-me-norte",
        latitude=None,
        longitude=None,
    )


@pytest.fixture
def estabelecimento_inativo(db):
    return Estabelecimento.objects.create(
        nome_fantasia="Lava-Me Fechado",
        cnpj="33333333333333",
        endereco_completo="Rua Fechada, 0",
        is_active=False,
        slug="lava-me-fechado",
        latitude=-10.200,
        longitude=-48.350,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Cenário 1: Apenas estabelecimentos ativos aparecem na lista
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
def test_lista_retorna_apenas_estabelecimentos_ativos(
    api_client, estabelecimento_ativo, estabelecimento_inativo
):
    response = api_client.get(URL)

    assert response.status_code == 200
    nomes = [e['nome_fantasia'] for e in response.data]
    assert "Lava-Me Centro" in nomes
    assert "Lava-Me Fechado" not in nomes


# ─────────────────────────────────────────────────────────────────────────────
# Cenário 2: Resposta inclui todos os campos obrigatórios para o mapa
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
def test_campos_obrigatorios_presentes_na_resposta(api_client, estabelecimento_ativo):
    response = api_client.get(URL)

    assert response.status_code == 200
    assert len(response.data) == 1

    item = response.data[0]
    assert 'id' in item
    assert 'nome_fantasia' in item
    assert 'slug' in item
    assert 'latitude' in item
    assert 'longitude' in item
    assert 'logo' in item
    assert 'endereco_completo' in item


# ─────────────────────────────────────────────────────────────────────────────
# Cenário 3: Valores de lat/long corretos para o estabelecimento ativo
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
def test_valores_de_geolocalizacao_corretos(api_client, estabelecimento_ativo):
    response = api_client.get(URL)

    assert response.status_code == 200
    item = response.data[0]
    assert item['latitude'] == pytest.approx(-10.184)
    assert item['longitude'] == pytest.approx(-48.334)
    assert item['slug'] == "lava-me-centro"


# ─────────────────────────────────────────────────────────────────────────────
# Cenário 4: Estabelecimento sem lat/long retorna null — não quebra a resposta
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
def test_estabelecimento_sem_geolocalizacao_retorna_null(
    api_client, estabelecimento_sem_geolocalizacao
):
    response = api_client.get(URL)

    assert response.status_code == 200
    assert len(response.data) == 1
    item = response.data[0]
    assert item['latitude'] is None
    assert item['longitude'] is None


# ─────────────────────────────────────────────────────────────────────────────
# Cenário 5: Endpoint não exige autenticação (AllowAny)
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
def test_endpoint_publico_sem_autenticacao(api_client, estabelecimento_ativo):
    # Garante que não há token no cliente
    api_client.credentials()
    response = api_client.get(URL)

    assert response.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# Cenário 6: Lista vazia quando nenhum estabelecimento ativo existe
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
def test_lista_vazia_sem_estabelecimentos_ativos(api_client, estabelecimento_inativo):
    response = api_client.get(URL)

    assert response.status_code == 200
    assert len(response.data) == 0


# ─────────────────────────────────────────────────────────────────────────────
# Cenário 7: Logo null quando estabelecimento não tem logo cadastrada
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
def test_logo_null_quando_nao_cadastrada(api_client, estabelecimento_ativo):
    # O fixture não define logo, então deve retornar null
    response = api_client.get(URL)

    assert response.status_code == 200
    item = response.data[0]
    assert item['logo'] is None
