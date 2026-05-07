"""
RF-24 — Testes de Aceitação: Cancelamento Autônomo de Agendamento
Cobertura: CA-01 a CA-05 conforme docs/3_regras_negocio/sprint_3/rf24_cancelamento_autonomo.md
"""
import uuid
from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone

from operacao.tests.factories import OrdemServicoFactory


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _url(slug):
    return f"/api/publico/agendamento/ordens-servico/{slug}/cancelar/"


# ---------------------------------------------------------------------------
# CA-01: Cancelamento com antecedência suficiente (≥ 1h)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_ca01_cancelamento_sucesso_antecedencia_suficiente(client):
    """CA-01: Cliente cancela com 2h de antecedência. Status → CANCELADO."""
    os = OrdemServicoFactory(
        status='PATIO',
        data_hora=timezone.now() + timedelta(hours=2),
    )
    slug = os.slug_cancelamento

    response = client.patch(
        _url(slug),
        data={'motivo_cancelamento': 'Imprevisto pessoal'},
        content_type='application/json',
    )

    assert response.status_code == 200
    assert response.json()['detail'] == 'Agendamento cancelado com sucesso.'

    os.refresh_from_db()
    assert os.status == 'CANCELADO'
    assert os.cancelado_por == 'CLIENTE_PORTAL'
    assert os.cancelado_em is not None
    assert os.motivo_cancelamento == 'Imprevisto pessoal'


# ---------------------------------------------------------------------------
# CA-02: Bloqueio por antecedência insuficiente (< 1h)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_ca02_bloqueio_antecedencia_insuficiente(client):
    """CA-02: Cliente tenta cancelar com 45 minutos. Sistema rejeita com 400."""
    os = OrdemServicoFactory(
        status='PATIO',
        data_hora=timezone.now() + timedelta(minutes=45),
    )

    response = client.patch(
        _url(os.slug_cancelamento),
        data={},
        content_type='application/json',
    )

    assert response.status_code == 400
    assert 'antecedência' in response.json()['detail'].lower()

    os.refresh_from_db()
    assert os.status == 'PATIO'  # Status não deve mudar


# ---------------------------------------------------------------------------
# CA-03: Bloqueio por status já iniciado
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@pytest.mark.parametrize('status_iniciado', [
    'VISTORIA_INICIAL', 'EM_EXECUCAO', 'LIBERACAO', 'BLOQUEADO_INCIDENTE'
])
def test_ca03_bloqueio_status_ja_iniciado(client, status_iniciado):
    """CA-03: Qualquer status diferente de PATIO retorna 403."""
    os = OrdemServicoFactory(
        status=status_iniciado,
        data_hora=timezone.now() + timedelta(hours=3),
    )

    response = client.patch(
        _url(os.slug_cancelamento),
        data={},
        content_type='application/json',
    )

    assert response.status_code == 403
    assert 'iniciado' in response.json()['detail'].lower()


# ---------------------------------------------------------------------------
# CA-04: Slug inválido/inexistente
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_ca04_slug_inexistente(client):
    """CA-04: UUID válido mas inexistente no banco retorna 400."""
    slug_inexistente = uuid.uuid4()

    response = client.patch(
        _url(slug_inexistente),
        data={},
        content_type='application/json',
    )

    assert response.status_code == 400
    assert 'não encontrado' in response.json()['detail'].lower()


# ---------------------------------------------------------------------------
# CA-05: Liberação automática do slot (RF-24.4)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_ca05_horario_liberado_apos_cancelamento(client):
    """
    CA-05: Após cancelar, a OS CANCELADA não aparece no filtro de conflitos do ORM.
    RF-24.4: A liberação é automática — DisponibilidadeService e verificar_conflito
    filtram apenas status__in=[PATIO, VISTORIA_INICIAL, EM_EXECUCAO, LIBERACAO,
    BLOQUEADO_INCIDENTE]. OS CANCELADA sai desse conjunto imediatamente.
    """
    from operacao.models import OrdemServico as OSModel

    hora_agendada = timezone.now() + timedelta(hours=3)
    os = OrdemServicoFactory(status='PATIO', data_hora=hora_agendada)

    # Antes: OS aparece no filtro de conflitos
    status_conflito = ['PATIO', 'VISTORIA_INICIAL', 'EM_EXECUCAO', 'LIBERACAO', 'BLOQUEADO_INCIDENTE']
    assert OSModel.objects.filter(id=os.id, status__in=status_conflito).exists(), \
        "OS deveria aparecer como conflito antes do cancelamento"

    # Cancela
    response = client.patch(
        _url(os.slug_cancelamento),
        data={},
        content_type='application/json',
    )
    assert response.status_code == 200

    os.refresh_from_db()
    assert os.status == 'CANCELADO'

    # Após: OS não aparece mais no filtro de conflitos (horário liberado)
    assert not OSModel.objects.filter(id=os.id, status__in=status_conflito).exists(), \
        "OS CANCELADA não deveria aparecer como conflito após cancelamento"
