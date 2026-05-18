import pytest
from rest_framework.test import APIClient

from operacao.tests.factories import (
    ClienteFactory,
    EstabelecimentoFactory,
    GestorFactory,
    IncidenteOSFactory,
    MidiaOrdemServicoFactory,
    OrdemServicoFactory,
    ServicoFactory,
    UserFactory,
    VeiculoFactory,
)


def _auth(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
class TestRF31HistoricoUnificado:
    url = '/api/shared/historico/'

    def test_cliente_recebe_apenas_os_de_sua_titularidade_em_envelope(self):
        cliente = ClienteFactory()
        outro_cliente = ClienteFactory()
        est = EstabelecimentoFactory()
        servico = ServicoFactory(estabelecimento=est)
        veiculo_cliente = VeiculoFactory(estabelecimento=est, cliente=cliente)
        veiculo_outro = VeiculoFactory(estabelecimento=est, cliente=outro_cliente)
        os_cliente = OrdemServicoFactory(
            estabelecimento=est,
            servico=servico,
            veiculo=veiculo_cliente,
            status='FINALIZADO',
        )
        OrdemServicoFactory(
            estabelecimento=est,
            servico=servico,
            veiculo=veiculo_outro,
            status='FINALIZADO',
        )

        response = _auth(cliente.user).get(self.url)

        assert response.status_code == 200
        body = response.json()
        assert set(body) == {'data', 'meta', 'errors'}
        assert body['meta']['perfil'] == 'CLIENTE'
        assert body['errors'] == []
        ids = [item['id'] for item in body['data']['historico']]
        assert ids == [os_cliente.id]
        assert 'funcionario_nome' not in body['data']['historico'][0]

    def test_gestor_recebe_historico_paginado_do_proprio_estabelecimento(self):
        gestor = GestorFactory()
        outro_gestor = GestorFactory()
        os_gestor = OrdemServicoFactory(
            estabelecimento=gestor.estabelecimento,
            status='FINALIZADO',
        )
        OrdemServicoFactory(
            estabelecimento=outro_gestor.estabelecimento,
            status='FINALIZADO',
        )

        response = _auth(gestor.user).get(self.url)

        assert response.status_code == 200
        body = response.json()
        assert body['meta']['perfil'] == 'GESTOR'
        assert body['meta']['count'] == 1
        assert body['data'][0]['id'] == os_gestor.id
        assert 'funcionario_nome' in body['data'][0]

    def test_funcionario_recebe_historico_por_periodo_do_estabelecimento(self):
        est = EstabelecimentoFactory()
        funcionario = UserFactory(estabelecimento=est)
        os_funcionario = OrdemServicoFactory(estabelecimento=est, status='FINALIZADO')
        OrdemServicoFactory(status='FINALIZADO')

        from django.utils import timezone

        data = timezone.localdate(os_funcionario.data_hora).isoformat()
        response = _auth(funcionario).get(
            self.url,
            {'data_inicial': data, 'data_final': data},
        )

        assert response.status_code == 200
        body = response.json()
        assert body['meta']['perfil'] == 'FUNCIONARIO'
        assert [item['id'] for item in body['data']] == [os_funcionario.id]

    @pytest.mark.parametrize('legacy_url', [
        '/api/ordens-servico/gestor/historico/',
        '/api/ordens-servico/historico/',
        '/api/cliente/historico/',
    ])
    def test_rotas_legadas_de_historico_foram_removidas(self, legacy_url):
        gestor = GestorFactory()

        response = _auth(gestor.user).get(legacy_url)

        assert response.status_code == 404


@pytest.mark.django_db
class TestRF31ComparativoIncidente:
    def test_comparativo_retorna_entrada_com_5_fotos_e_foto_do_incidente(self):
        gestor = GestorFactory()
        ordem = OrdemServicoFactory(
            estabelecimento=gestor.estabelecimento,
            status='BLOQUEADO_INCIDENTE',
        )
        entrada = [
            MidiaOrdemServicoFactory(ordem_servico=ordem, momento='VISTORIA_GERAL')
            for _ in range(5)
        ]
        incidente = IncidenteOSFactory(
            ordem_servico=ordem,
            status_anterior_os='EM_EXECUCAO',
        )

        response = _auth(gestor.user).get(f'/api/gestao/incidentes/{incidente.id}/comparativo/')

        assert response.status_code == 200
        body = response.json()
        assert set(body) == {'data', 'meta', 'errors'}
        assert body['meta']['total_entrada'] == 5
        assert body['meta']['total_incidente'] == 1
        assert [foto['id'] for foto in body['data']['entrada']] == [foto.id for foto in entrada]
        assert body['data']['incidente'][0]['id'] == incidente.id
        assert body['data']['ordem_servico']['id'] == ordem.id

    def test_comparativo_bloqueia_gestor_de_outro_estabelecimento(self):
        gestor = GestorFactory()
        outro_gestor = GestorFactory()
        incidente = IncidenteOSFactory(
            ordem_servico=OrdemServicoFactory(
                estabelecimento=outro_gestor.estabelecimento,
                status='BLOQUEADO_INCIDENTE',
            )
        )

        response = _auth(gestor.user).get(f'/api/gestao/incidentes/{incidente.id}/comparativo/')

        assert response.status_code == 403

    def test_comparativo_tem_fallback_para_os_antiga_sem_fotos_de_entrada(self):
        gestor = GestorFactory()
        ordem = OrdemServicoFactory(
            estabelecimento=gestor.estabelecimento,
            status='BLOQUEADO_INCIDENTE',
        )
        incidente = IncidenteOSFactory(
            ordem_servico=ordem,
            status_anterior_os='EM_EXECUCAO',
        )

        response = _auth(gestor.user).get(f'/api/gestao/incidentes/{incidente.id}/comparativo/')

        assert response.status_code == 200
        body = response.json()
        assert body['data']['entrada'] == []
        assert body['meta']['total_entrada'] == 0
