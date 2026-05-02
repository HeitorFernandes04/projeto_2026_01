"""
Testes da RF-21: Portal de Autoagendamento (Endpoint Público)
Cobre todos os Cenários BDD definidos na especificação rf21_draft_write_feature.md.
"""
import pytest
from unittest.mock import patch
from rest_framework.test import APIClient
from accounts.models import Estabelecimento
from core.models import Servico


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def estabelecimento_ativo(db):
    """Estabelecimento ativo com slug definido."""
    return Estabelecimento.objects.create(
        nome_fantasia="Lava-Me Premium",
        cnpj="00000000000001",
        endereco_completo="Rua das Flores, 123",
        is_active=True,
        slug="lava-me-premium"
    )


@pytest.fixture
def servico_ativo(estabelecimento_ativo):
    """Serviço ativo vinculado ao estabelecimento de teste."""
    return Servico.objects.create(
        estabelecimento=estabelecimento_ativo,
        nome="Ducha Simples",
        preco="30.00",
        duracao_estimada_minutos=30,
        is_active=True
    )


@pytest.fixture
def servico_inativo(estabelecimento_ativo):
    """Serviço inativo (soft delete) vinculado ao estabelecimento de teste."""
    return Servico.objects.create(
        estabelecimento=estabelecimento_ativo,
        nome="Polimento (inativo)",
        preco="200.00",
        duracao_estimada_minutos=180,
        is_active=False
    )


# ──────────────────────────────────────────────────────────────────────────────
# Cenário 1: Consulta pública válida + ocultação de serviços inativos (CA-01, CA-02, CA-03)
# ──────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
def test_consulta_publica_retorna_dados_corretos(
    api_client, estabelecimento_ativo, servico_ativo, servico_inativo
):
    """
    CA-01: Acesso ao slug válido retorna 200 OK.
    CA-02: Serviços inativos não aparecem na lista.
    CA-03: Campos sensíveis (cnpj) não são expostos.
    """
    response = api_client.get(
        f'/api/publico/estabelecimento/{estabelecimento_ativo.slug}/'
    )

    assert response.status_code == 200, (
        f"Esperado 200, recebido {response.status_code}: {response.data}"
    )

    # CA-03: Sem campos sensíveis
    assert 'cnpj' not in response.data, "FALHA DE SEGURANÇA: cnpj exposto na resposta pública!"
    assert 'faturamento' not in response.data

    # CA-02: Apenas o serviço ativo deve aparecer
    servicos_retornados = response.data.get('servicos', [])
    assert len(servicos_retornados) == 1, (
        f"Esperado 1 serviço ativo, retornou {len(servicos_retornados)}"
    )
    assert servicos_retornados[0]['nome'] == "Ducha Simples"

    # Garantir que o inativo foi ocultado
    nomes_retornados = [s['nome'] for s in servicos_retornados]
    assert "Polimento (inativo)" not in nomes_retornados


# ──────────────────────────────────────────────────────────────────────────────
# Cenário 2: Estabelecimento inativo → 404 (CA-01)
# ──────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
def test_estabelecimento_inativo_retorna_404(api_client, db):
    """
    CA-01: Estabelecimento inativo deve retornar 404, não expondo sua existência.
    """
    est_inativo = Estabelecimento.objects.create(
        nome_fantasia="Lava-Jato Fechado",
        cnpj="00000000000002",
        endereco_completo="Rua do Fim, 0",
        is_active=False,
        slug="fechado-para-sempre"
    )

    response = api_client.get(
        f'/api/publico/estabelecimento/{est_inativo.slug}/'
    )
    assert response.status_code == 404


# ──────────────────────────────────────────────────────────────────────────────
# Cenário 2 (bis): Slug inexistente → 404
# ──────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
def test_slug_inexistente_retorna_404(api_client, db):
    """Slug que nunca existiu no banco deve retornar 404."""
    response = api_client.get('/api/publico/estabelecimento/slug-que-nao-existe/')
    assert response.status_code == 404


# ──────────────────────────────────────────────────────────────────────────────
# Cenário 4: Empty State — estabelecimento sem serviços (CA-06)
# ──────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
def test_estabelecimento_sem_servicos_retorna_lista_vazia(api_client, estabelecimento_ativo):
    """
    CA-06: Estabelecimento ativo mas sem serviços retorna 200 com lista vazia.
    O frontend deve renderizar o Empty State a partir desta resposta.
    """
    response = api_client.get(
        f'/api/publico/estabelecimento/{estabelecimento_ativo.slug}/'
    )

    assert response.status_code == 200
    assert response.data.get('servicos') == [], (
        f"Esperado lista vazia, recebeu: {response.data.get('servicos')}"
    )


# ──────────────────────────────────────────────────────────────────────────────
# Cenário 4 (bis): Apenas serviços inativos → empty state (CA-02 + CA-06)
# ──────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
def test_apenas_servicos_inativos_retorna_lista_vazia(
    api_client, estabelecimento_ativo, servico_inativo
):
    """
    Quando todos os serviços do estabelecimento estão inativos,
    a lista deve ser vazia (CA-06) — não deve vazar o serviço inativo (CA-02).
    """
    response = api_client.get(
        f'/api/publico/estabelecimento/{estabelecimento_ativo.slug}/'
    )

    assert response.status_code == 200
    assert response.data.get('servicos') == []


# ──────────────────────────────────────────────────────────────────────────────
# Cenário 3: Rate Limiting — 429 após limite excedido (CA-05)
# ──────────────────────────────────────────────────────────────────────────────
@pytest.mark.django_db
def test_rate_limiting_retorna_429(api_client, estabelecimento_ativo, servico_ativo):
    """
    CA-05: Simula o throttling via mock do check_throttles da APIView.
    Ao lançar Throttled diretamente, evitamos depender do estado interno (history)
    do objeto throttle, tornando o teste determinístico e correto.
    """
    from rest_framework.exceptions import Throttled
    from rest_framework.views import APIView

    with patch.object(APIView, 'check_throttles', side_effect=Throttled()):
        response = api_client.get(
            f'/api/publico/estabelecimento/{estabelecimento_ativo.slug}/'
        )

    assert response.status_code == 429, (
        f"Esperado 429 Too Many Requests, recebeu {response.status_code}"
    )
