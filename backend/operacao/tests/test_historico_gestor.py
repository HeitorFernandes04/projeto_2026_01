import pytest
from datetime import timedelta
from django.utils import timezone
from rest_framework.test import APIClient

from operacao.tests.factories import (
    EstabelecimentoFactory,
    GestorFactory,
    MidiaOrdemServicoFactory,
    OrdemServicoFactory,
    UserFactory,
)


# ---------------------------------------------------------------------------
# RF-17 — Histórico Consolidado de Atendimentos (visão do Gestor)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestHistoricoGestorListView:
    URL = '/api/ordens-servico/gestor/historico/'

    def _client(self, user):
        c = APIClient()
        c.force_authenticate(user=user)
        return c

    # Teste 1 (CA-01): Gestor recebe lista paginada do seu estabelecimento
    def test_lista_os_com_sucesso_e_paginada(self):
        gestor = GestorFactory()
        OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='FINALIZADO')
        OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='CANCELADO')

        response = self._client(gestor.user).get(self.URL)

        assert response.status_code == 200
        data = response.json()
        assert 'count' in data
        assert 'results' in data
        assert data['count'] == 2

    # Teste 2: Filtro por placa retorna apenas a OS correta
    def test_filtra_por_placa(self):
        gestor = GestorFactory()
        estab = gestor.estabelecimento
        os_alvo = OrdemServicoFactory(estabelecimento=estab, status='FINALIZADO')
        OrdemServicoFactory(estabelecimento=estab, status='FINALIZADO')
        placa_alvo = os_alvo.veiculo.placa

        response = self._client(gestor.user).get(self.URL, {'placa': placa_alvo})

        assert response.status_code == 200
        data = response.json()
        assert data['count'] == 1
        assert data['results'][0]['id'] == os_alvo.id

    # Teste 3: Filtro por status retorna apenas OS com aquele status
    def test_filtra_por_status(self):
        gestor = GestorFactory()
        estab = gestor.estabelecimento
        OrdemServicoFactory(estabelecimento=estab, status='FINALIZADO')
        OrdemServicoFactory(estabelecimento=estab, status='CANCELADO')

        response = self._client(gestor.user).get(self.URL, {'status': 'FINALIZADO'})

        assert response.status_code == 200
        data = response.json()
        assert data['count'] == 1
        assert data['results'][0]['status'] == 'FINALIZADO'

    # Teste 4: Filtro por período retorna apenas OS dentro do intervalo
    def test_filtra_por_periodo(self):
        gestor = GestorFactory()
        hoje = timezone.localdate()
        ontem = hoje - timedelta(days=1)
        OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='FINALIZADO')

        response = self._client(gestor.user).get(self.URL, {
            'data_inicio': str(ontem),
            'data_fim': str(hoje),
        })

        assert response.status_code == 200
        assert response.json()['count'] >= 1

    # Teste 5 (Antiviés - RN-15): data_inicio > data_fim → 400
    def test_rejeita_datas_invertidas(self):
        gestor = GestorFactory()
        hoje = timezone.localdate()
        ontem = hoje - timedelta(days=1)

        response = self._client(gestor.user).get(self.URL, {
            'data_inicio': str(hoje),
            'data_fim': str(ontem),
        })

        assert response.status_code == 400

    # Teste 6 (Antiviés - Sanitização Cronológica): data_fim futura → 400
    def test_rejeita_data_fim_futura(self):
        gestor = GestorFactory()
        hoje = timezone.localdate()
        amanha = hoje + timedelta(days=1)

        response = self._client(gestor.user).get(self.URL, {
            'data_inicio': str(hoje),
            'data_fim': str(amanha),
        })

        assert response.status_code == 400

    # Teste 7 (RNF-02 - Multi-tenant): Gestor A não vê OS do Gestor B
    def test_isolamento_multitenant(self):
        gestor_a = GestorFactory()
        gestor_b = GestorFactory()
        OrdemServicoFactory(estabelecimento=gestor_b.estabelecimento, status='FINALIZADO')
        OrdemServicoFactory(estabelecimento=gestor_a.estabelecimento, status='FINALIZADO')

        response = self._client(gestor_a.user).get(self.URL)

        assert response.status_code == 200
        assert response.json()['count'] == 1

    # Teste 8 (RNF-01): Funcionário recebe 403
    def test_funcionario_recebe_403(self):
        estab = EstabelecimentoFactory()
        funcionario = UserFactory(estabelecimento=estab)

        response = self._client(funcionario).get(self.URL)

        assert response.status_code == 403

    # Teste 9: Sem autenticação recebe 401
    def test_sem_autenticacao_recebe_401(self):
        response = APIClient().get(self.URL)

        assert response.status_code == 401

    # Teste 10: Campos obrigatórios presentes no resultado
    def test_resultado_contem_campos_obrigatorios(self):
        gestor = GestorFactory()
        OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='FINALIZADO')

        response = self._client(gestor.user).get(self.URL)

        item = response.json()['results'][0]
        assert 'id' in item
        assert 'placa' in item
        assert 'modelo' in item
        assert 'servico_nome' in item
        assert 'status' in item
        assert 'data_hora' in item


# ---------------------------------------------------------------------------
# RF-18 — Auditoria de Qualidade Visual (Galeria/Dossiê da OS)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestHistoricoGestorFotosView:
    URL_TEMPLATE = '/api/ordens-servico/gestor/historico/{}/fotos/'

    def _client(self, user):
        c = APIClient()
        c.force_authenticate(user=user)
        return c

    def _url(self, os_id):
        return self.URL_TEMPLATE.format(os_id)

    # Teste 1: Resposta contém as três seções da galeria
    def test_galeria_retorna_as_tres_secoes(self):
        gestor = GestorFactory()
        os = OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='FINALIZADO')
        MidiaOrdemServicoFactory(ordem_servico=os, momento='VISTORIA_GERAL')
        MidiaOrdemServicoFactory(ordem_servico=os, momento='FINALIZADO')

        response = self._client(gestor.user).get(self._url(os.id))

        assert response.status_code == 200
        data = response.json()
        assert 'estado_inicial' in data
        assert 'estado_meio' in data
        assert 'estado_final' in data

    # Teste 2 (CA-02): estado_inicial agrupa VISTORIA_GERAL e AVARIA_PREVIA
    def test_estado_inicial_agrupa_vistoria_e_avarias(self):
        gestor = GestorFactory()
        os = OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='FINALIZADO')
        MidiaOrdemServicoFactory(ordem_servico=os, momento='VISTORIA_GERAL')
        MidiaOrdemServicoFactory(ordem_servico=os, momento='VISTORIA_GERAL')
        MidiaOrdemServicoFactory(ordem_servico=os, momento='AVARIA_PREVIA')

        response = self._client(gestor.user).get(self._url(os.id))

        assert len(response.json()['estado_inicial']) == 3

    # Teste 3 (CA-02): estado_final agrupa fotos com momento FINALIZADO
    def test_estado_final_agrupa_fotos_finalizado(self):
        gestor = GestorFactory()
        os = OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='FINALIZADO')
        MidiaOrdemServicoFactory(ordem_servico=os, momento='FINALIZADO')
        MidiaOrdemServicoFactory(ordem_servico=os, momento='FINALIZADO')

        response = self._client(gestor.user).get(self._url(os.id))

        assert len(response.json()['estado_final']) == 2

    # Teste 4 (Auditoria 360°): estado_meio inclui fotos de EXECUCAO (incidentes)
    def test_estado_meio_inclui_fotos_de_execucao(self):
        gestor = GestorFactory()
        os = OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='FINALIZADO')
        MidiaOrdemServicoFactory(ordem_servico=os, momento='EXECUCAO')

        response = self._client(gestor.user).get(self._url(os.id))

        assert len(response.json()['estado_meio']) == 1

    # Teste 5: OS sem fotos retorna estrutura vazia mas válida
    def test_os_sem_fotos_retorna_estrutura_vazia(self):
        gestor = GestorFactory()
        os = OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='FINALIZADO')

        response = self._client(gestor.user).get(self._url(os.id))

        assert response.status_code == 200
        data = response.json()
        assert data['estado_inicial'] == []
        assert data['estado_meio'] == []
        assert data['estado_final'] == []

    # Teste 6 (RNF-02 - IDOR): OS de outro estabelecimento → 403
    def test_isolamento_os_outro_estabelecimento(self):
        gestor_a = GestorFactory()
        gestor_b = GestorFactory()
        os_b = OrdemServicoFactory(estabelecimento=gestor_b.estabelecimento, status='FINALIZADO')

        response = self._client(gestor_a.user).get(self._url(os_b.id))

        assert response.status_code == 403

    # Teste 7 (RNF-01): Funcionário recebe 403
    def test_funcionario_recebe_403(self):
        estab = EstabelecimentoFactory()
        funcionario = UserFactory(estabelecimento=estab)
        os = OrdemServicoFactory(estabelecimento=estab, status='FINALIZADO')

        response = self._client(funcionario).get(self._url(os.id))

        assert response.status_code == 403
