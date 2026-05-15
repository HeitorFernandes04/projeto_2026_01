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


@pytest.mark.django_db
class TestHistoricoGestorListView:
    URL = '/api/shared/historico/'

    def _client(self, user):
        c = APIClient()
        c.force_authenticate(user=user)
        return c

    def test_lista_os_com_sucesso_e_paginada(self):
        gestor = GestorFactory()
        OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='FINALIZADO')
        OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='CANCELADO')

        response = self._client(gestor.user).get(self.URL)

        assert response.status_code == 200
        body = response.json()
        assert body['meta']['perfil'] == 'GESTOR'
        assert body['meta']['count'] == 2
        assert len(body['data']) == 2

    def test_filtra_por_placa(self):
        gestor = GestorFactory()
        estab = gestor.estabelecimento
        os_alvo = OrdemServicoFactory(estabelecimento=estab, status='FINALIZADO')
        OrdemServicoFactory(estabelecimento=estab, status='FINALIZADO')

        response = self._client(gestor.user).get(self.URL, {'placa': os_alvo.veiculo.placa})

        assert response.status_code == 200
        body = response.json()
        assert body['meta']['count'] == 1
        assert body['data'][0]['id'] == os_alvo.id

    def test_filtra_por_status(self):
        gestor = GestorFactory()
        estab = gestor.estabelecimento
        OrdemServicoFactory(estabelecimento=estab, status='FINALIZADO')
        OrdemServicoFactory(estabelecimento=estab, status='CANCELADO')

        response = self._client(gestor.user).get(self.URL, {'status': 'FINALIZADO'})

        assert response.status_code == 200
        body = response.json()
        assert body['meta']['count'] == 1
        assert body['data'][0]['status'] == 'FINALIZADO'

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
        assert response.json()['meta']['count'] >= 1

    def test_rejeita_datas_invertidas(self):
        gestor = GestorFactory()
        hoje = timezone.localdate()
        ontem = hoje - timedelta(days=1)

        response = self._client(gestor.user).get(self.URL, {
            'data_inicio': str(hoje),
            'data_fim': str(ontem),
        })

        assert response.status_code == 400
        assert response.json()['errors']

    def test_rejeita_data_fim_futura(self):
        gestor = GestorFactory()
        hoje = timezone.localdate()
        amanha = hoje + timedelta(days=1)

        response = self._client(gestor.user).get(self.URL, {
            'data_inicio': str(hoje),
            'data_fim': str(amanha),
        })

        assert response.status_code == 400
        assert response.json()['errors']

    def test_isolamento_multitenant(self):
        gestor_a = GestorFactory()
        gestor_b = GestorFactory()
        OrdemServicoFactory(estabelecimento=gestor_b.estabelecimento, status='FINALIZADO')
        OrdemServicoFactory(estabelecimento=gestor_a.estabelecimento, status='FINALIZADO')

        response = self._client(gestor_a.user).get(self.URL)

        assert response.status_code == 200
        assert response.json()['meta']['count'] == 1

    def test_funcionario_recebe_historico_unificado_por_periodo(self):
        estab = EstabelecimentoFactory()
        funcionario = UserFactory(estabelecimento=estab)
        ordem = OrdemServicoFactory(estabelecimento=estab, status='FINALIZADO')
        data = timezone.localdate(ordem.data_hora).isoformat()

        response = self._client(funcionario).get(self.URL, {
            'data_inicial': data,
            'data_final': data,
        })

        assert response.status_code == 200
        assert response.json()['meta']['perfil'] == 'FUNCIONARIO'

    def test_sem_autenticacao_recebe_401(self):
        response = APIClient().get(self.URL)

        assert response.status_code == 401

    def test_resultado_contem_campos_obrigatorios(self):
        gestor = GestorFactory()
        OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='FINALIZADO')

        response = self._client(gestor.user).get(self.URL)

        item = response.json()['data'][0]
        for campo in ['id', 'placa', 'modelo', 'servico_nome', 'status', 'data_hora']:
            assert campo in item


@pytest.mark.django_db
class TestHistoricoGestorFotosView:
    URL_TEMPLATE = '/api/shared/historico/{}/galeria/'

    def _client(self, user):
        c = APIClient()
        c.force_authenticate(user=user)
        return c

    def _url(self, os_id):
        return self.URL_TEMPLATE.format(os_id)

    def test_galeria_retorna_as_tres_secoes(self):
        gestor = GestorFactory()
        os = OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='FINALIZADO')
        MidiaOrdemServicoFactory(ordem_servico=os, momento='VISTORIA_GERAL')
        MidiaOrdemServicoFactory(ordem_servico=os, momento='FINALIZADO')

        response = self._client(gestor.user).get(self._url(os.id))

        assert response.status_code == 200
        data = response.json()['data']
        assert 'estado_inicial' in data
        assert 'estado_meio' in data
        assert 'estado_final' in data

    def test_estado_inicial_agrupa_vistoria_e_avarias(self):
        gestor = GestorFactory()
        os = OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='FINALIZADO')
        MidiaOrdemServicoFactory(ordem_servico=os, momento='VISTORIA_GERAL')
        MidiaOrdemServicoFactory(ordem_servico=os, momento='VISTORIA_GERAL')
        MidiaOrdemServicoFactory(ordem_servico=os, momento='AVARIA_PREVIA')

        response = self._client(gestor.user).get(self._url(os.id))

        assert len(response.json()['data']['estado_inicial']) == 3

    def test_estado_final_agrupa_fotos_finalizado(self):
        gestor = GestorFactory()
        os = OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='FINALIZADO')
        MidiaOrdemServicoFactory(ordem_servico=os, momento='FINALIZADO')
        MidiaOrdemServicoFactory(ordem_servico=os, momento='FINALIZADO')

        response = self._client(gestor.user).get(self._url(os.id))

        assert len(response.json()['data']['estado_final']) == 2

    def test_estado_meio_inclui_fotos_de_execucao(self):
        gestor = GestorFactory()
        os = OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='FINALIZADO')
        MidiaOrdemServicoFactory(ordem_servico=os, momento='EXECUCAO')

        response = self._client(gestor.user).get(self._url(os.id))

        assert len(response.json()['data']['estado_meio']) == 1

    def test_os_sem_fotos_retorna_estrutura_vazia(self):
        gestor = GestorFactory()
        os = OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='FINALIZADO')

        response = self._client(gestor.user).get(self._url(os.id))

        assert response.status_code == 200
        data = response.json()['data']
        assert data['estado_inicial'] == []
        assert data['estado_meio'] == []
        assert data['estado_final'] == []

    def test_isolamento_os_outro_estabelecimento(self):
        gestor_a = GestorFactory()
        gestor_b = GestorFactory()
        os_b = OrdemServicoFactory(estabelecimento=gestor_b.estabelecimento, status='FINALIZADO')

        response = self._client(gestor_a.user).get(self._url(os_b.id))

        assert response.status_code == 403

    def test_funcionario_recebe_403(self):
        estab = EstabelecimentoFactory()
        funcionario = UserFactory(estabelecimento=estab)
        os = OrdemServicoFactory(estabelecimento=estab, status='FINALIZADO')

        response = self._client(funcionario).get(self._url(os.id))

        assert response.status_code == 403
