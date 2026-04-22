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

    # Teste 1: OS agrupadas nas 4 novas colunas
    def test_retorna_os_agrupadas_por_coluna(self):
        gestor = GestorFactory()
        estab = gestor.estabelecimento
        OrdemServicoFactory(estabelecimento=estab, status='PATIO')
        OrdemServicoFactory(estabelecimento=estab, status='VISTORIA_INICIAL')
        OrdemServicoFactory(estabelecimento=estab, status='EM_EXECUCAO')
        OrdemServicoFactory(estabelecimento=estab, status='LIBERACAO')
        OrdemServicoFactory(estabelecimento=estab, status='BLOQUEADO_INCIDENTE')

        response = self._client(gestor.user).get(self.URL)

        assert response.status_code == 200
        data = response.json()
        assert len(data['PATIO']) == 1
        assert len(data['LAVAGEM']) == 3   # VISTORIA_INICIAL + EM_EXECUCAO + LIBERACAO
        assert len(data['INCIDENTES']) == 1

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

    # RN: OS em PATIO deve retornar tempo_decorrido_minutos = 0
    def test_os_patio_tem_tempo_zero(self):
        gestor = GestorFactory()
        OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='PATIO')

        response = self._client(gestor.user).get(self.URL)

        card = response.json()['PATIO'][0]
        assert card['tempo_decorrido_minutos'] == 0
        assert card['is_atrasado'] is False

    # CA-03: OS em EM_EXECUCAO acima da duração → is_atrasado=True
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

        assert response.json()['LAVAGEM'][0]['is_atrasado'] is True

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

        assert response.json()['LAVAGEM'][0]['is_atrasado'] is False

    # CA-01: CANCELADO não aparece no Kanban; FINALIZADO de outro dia também não
    def test_nao_exibe_canceladas_nem_finalizado_de_outro_dia(self):
        gestor = GestorFactory()
        estab = gestor.estabelecimento
        OrdemServicoFactory(estabelecimento=estab, status='CANCELADO')
        ontem = timezone.now() - timedelta(days=1)
        OrdemServicoFactory(
            estabelecimento=estab, status='FINALIZADO',
            horario_finalizacao=ontem,
        )
        OrdemServicoFactory(estabelecimento=estab, status='PATIO')

        response = self._client(gestor.user).get(self.URL)

        total = sum(len(v) for v in response.json().values())
        assert total == 1

    # OS finalizada hoje aparece na coluna FINALIZADO_HOJE
    def test_os_finalizado_hoje_aparece_na_coluna(self):
        gestor = GestorFactory()
        OrdemServicoFactory(
            estabelecimento=gestor.estabelecimento,
            status='FINALIZADO',
            horario_finalizacao=timezone.now(),
        )

        response = self._client(gestor.user).get(self.URL)

        assert len(response.json()['FINALIZADO_HOJE']) == 1

    # OS pendente de dia anterior deve aparecer no Kanban
    def test_os_pendente_dias_anteriores_aparece(self):
        gestor = GestorFactory()
        ontem = timezone.now() - timedelta(days=1)
        OrdemServicoFactory(
            estabelecimento=gestor.estabelecimento,
            status='EM_EXECUCAO',
            horario_lavagem=ontem,
        )

        response = self._client(gestor.user).get(self.URL)

        assert len(response.json()['LAVAGEM']) == 1

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
        assert set(data.keys()) == {'PATIO', 'LAVAGEM', 'FINALIZADO_HOJE', 'INCIDENTES'}

    # OS bloqueada por incidente aparece na coluna INCIDENTES
    def test_bloqueado_incidente_aparece_na_coluna_incidentes(self):
        gestor = GestorFactory()
        OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='BLOQUEADO_INCIDENTE')
        OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='PATIO')

        response = self._client(gestor.user).get(self.URL)

        assert len(response.json()['INCIDENTES']) == 1
        assert len(response.json()['PATIO']) == 1

    # Placa deve ter máscara XXX-XXXX nos cards
    def test_placa_formatada_com_mascara(self):
        gestor = GestorFactory()
        OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='PATIO')

        response = self._client(gestor.user).get(self.URL)

        placa = response.json()['PATIO'][0]['placa']
        assert '-' in placa

    # Teste 8: Funcionário (não-gestor) recebe 403
    def test_funcionario_recebe_403(self):
        estab = EstabelecimentoFactory()
        funcionario = UserFactory(estabelecimento=estab)

        response = self._client(funcionario).get(self.URL)

        assert response.status_code == 403

    # Sem autenticação recebe 401
    def test_sem_autenticacao_recebe_401(self):
        response = APIClient().get(self.URL)

        assert response.status_code == 401
