import pytest
from datetime import timedelta
from django.utils import timezone
from rest_framework.test import APIClient

from operacao.tests.factories import (
    EstabelecimentoFactory,
    GestorFactory,
    OrdemServicoFactory,
    ServicoFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestKanbanRF14:
    URL = '/api/ordens-servico/kanban/'

    def _client(self, user):
        c = APIClient()
        c.force_authenticate(user=user)
        return c

    # Teste 1: OS do dia agrupadas nas 4 colunas
    def test_retorna_os_do_dia_agrupadas_por_status(self):
        gestor = GestorFactory()
        estab = gestor.estabelecimento
        OrdemServicoFactory(estabelecimento=estab, status='PATIO')
        OrdemServicoFactory(estabelecimento=estab, status='VISTORIA_INICIAL')
        OrdemServicoFactory(estabelecimento=estab, status='EM_EXECUCAO')
        OrdemServicoFactory(estabelecimento=estab, status='LIBERACAO')

        response = self._client(gestor.user).get(self.URL)

        assert response.status_code == 200
        data = response.json()
        assert len(data['PATIO']) == 1
        assert len(data['VISTORIA_INICIAL']) == 1
        assert len(data['EM_EXECUCAO']) == 1
        assert len(data['LIBERACAO']) == 1

    # CA-02: Campos obrigatórios em cada card
    def test_card_contem_campos_obrigatorios(self):
        gestor = GestorFactory()
        OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='PATIO')

        response = self._client(gestor.user).get(self.URL)

        card = response.json()['PATIO'][0]
        assert 'id' in card
        assert 'placa' in card
        assert 'modelo' in card
        assert 'servico' in card
        assert 'duracao_estimada_minutos' in card
        assert 'tempo_decorrido_minutos' in card
        assert 'is_atrasado' in card

    # Teste 2 / CA-03: OS em EM_EXECUCAO acima da duração → is_atrasado=True
    def test_os_atrasada_e_sinalizada(self):
        gestor = GestorFactory()
        servico = ServicoFactory(
            estabelecimento=gestor.estabelecimento,
            duracao_estimada_minutos=30,
        )
        OrdemServicoFactory(
            estabelecimento=gestor.estabelecimento,
            status='EM_EXECUCAO',
            servico=servico,
            horario_lavagem=timezone.now() - timedelta(minutes=60),
        )

        response = self._client(gestor.user).get(self.URL)

        assert response.json()['EM_EXECUCAO'][0]['is_atrasado'] is True

    def test_os_dentro_do_prazo_nao_e_sinalizada(self):
        gestor = GestorFactory()
        servico = ServicoFactory(
            estabelecimento=gestor.estabelecimento,
            duracao_estimada_minutos=60,
        )
        OrdemServicoFactory(
            estabelecimento=gestor.estabelecimento,
            status='EM_EXECUCAO',
            servico=servico,
            horario_lavagem=timezone.now() - timedelta(minutes=10),
        )

        response = self._client(gestor.user).get(self.URL)

        assert response.json()['EM_EXECUCAO'][0]['is_atrasado'] is False

    # CA-01: OS FINALIZADO e CANCELADO não aparecem no Kanban
    def test_nao_exibe_os_finalizadas_e_canceladas(self):
        gestor = GestorFactory()
        estab = gestor.estabelecimento
        OrdemServicoFactory(estabelecimento=estab, status='FINALIZADO')
        OrdemServicoFactory(estabelecimento=estab, status='CANCELADO')
        OrdemServicoFactory(estabelecimento=estab, status='PATIO')

        response = self._client(gestor.user).get(self.URL)

        total = sum(len(v) for v in response.json().values())
        assert total == 1

    # RNF-01: Gestor só vê OS do próprio estabelecimento
    def test_isolamento_multi_tenant(self):
        gestor = GestorFactory()
        outro_estab = EstabelecimentoFactory()
        OrdemServicoFactory(estabelecimento=outro_estab, status='PATIO')
        OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='PATIO')

        response = self._client(gestor.user).get(self.URL)

        assert len(response.json()['PATIO']) == 1

    # Resposta sempre contém as 4 colunas mesmo vazias
    def test_resposta_sempre_contem_as_quatro_colunas(self):
        gestor = GestorFactory()

        response = self._client(gestor.user).get(self.URL)

        data = response.json()
        assert set(data.keys()) == {'PATIO', 'VISTORIA_INICIAL', 'EM_EXECUCAO', 'LIBERACAO'}

    # Teste 8: Funcionário (não-gestor) recebe 403
    def test_funcionario_recebe_403(self):
        estab = EstabelecimentoFactory()
        funcionario = UserFactory(estabelecimento=estab)

        response = self._client(funcionario).get(self.URL)

        assert response.status_code == 403

    # OS bloqueada por incidente não aparece nas colunas
    def test_bloqueado_incidente_nao_aparece_nas_colunas(self):
        gestor = GestorFactory()
        OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='BLOQUEADO_INCIDENTE')
        OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='PATIO')

        response = self._client(gestor.user).get(self.URL)

        total = sum(len(v) for v in response.json().values())
        assert total == 1

    # Sem autenticação recebe 401
    def test_sem_autenticacao_recebe_401(self):
        response = APIClient().get(self.URL)

        assert response.status_code == 401
