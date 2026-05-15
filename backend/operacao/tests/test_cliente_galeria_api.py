import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from operacao.tests.factories import (
    ClienteFactory,
    MidiaOrdemServicoFactory,
    OrdemServicoFactory,
    ServicoFactory,
    UserFactory,
    VeiculoFactory,
)


def _auth(client, user):
    token = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(token.access_token)}')


def _payload(response):
    return response.data['data']


@pytest.mark.django_db
class TestClienteGaleriaAPI:
    URL_TEMPLATE = '/api/shared/historico/{}/galeria/'

    def setup_method(self):
        self.api = APIClient()
        self.cliente = ClienteFactory(telefone_whatsapp='11999990000')
        self.servico = ServicoFactory()
        self.veiculo = VeiculoFactory(
            estabelecimento=self.servico.estabelecimento,
            cliente=self.cliente,
            celular_dono='11999990000',
        )
        self.ordem = OrdemServicoFactory(
            estabelecimento=self.servico.estabelecimento,
            veiculo=self.veiculo,
            servico=self.servico,
            status='FINALIZADO',
        )

    def test_acesso_sem_autenticacao_retorna_401(self):
        resp = self.api.get(self.URL_TEMPLATE.format(self.ordem.id))
        assert resp.status_code == 401

    def test_acesso_como_funcionario_retorna_403(self):
        funcionario = UserFactory(estabelecimento=self.servico.estabelecimento)
        _auth(self.api, funcionario)

        resp = self.api.get(self.URL_TEMPLATE.format(self.ordem.id))

        assert resp.status_code == 403

    def test_cliente_recebe_auditoria_inicial_finalizacao_e_laudo_tecnico(self):
        MidiaOrdemServicoFactory(ordem_servico=self.ordem, momento='VISTORIA_GERAL')
        MidiaOrdemServicoFactory(ordem_servico=self.ordem, momento='AVARIA_PREVIA')
        MidiaOrdemServicoFactory(ordem_servico=self.ordem, momento='FINALIZADO')
        MidiaOrdemServicoFactory(ordem_servico=self.ordem, momento='EXECUCAO')
        MidiaOrdemServicoFactory(ordem_servico=self.ordem, momento='INCIDENTE')

        _auth(self.api, self.cliente.user)
        resp = self.api.get(self.URL_TEMPLATE.format(self.ordem.id))

        assert resp.status_code == 200
        data = _payload(resp)
        assert set(data.keys()) == {
            'ordem_servico_id',
            'entrada',
            'finalizacao',
            'laudo_tecnico',
        }
        assert len(data['entrada']) == 2
        assert len(data['finalizacao']) == 1
        momentos_entrada = {foto['momento'] for foto in data['entrada']}
        momentos_finalizacao = {foto['momento'] for foto in data['finalizacao']}
        assert momentos_entrada == {'VISTORIA_GERAL', 'AVARIA_PREVIA'}
        assert momentos_finalizacao == {'FINALIZADO'}
        assert 'EXECUCAO' not in str(data)
        assert 'INCIDENTE' not in str(data)
        assert data['laudo_tecnico']['servico_realizado'] == self.servico.nome
        assert data['laudo_tecnico']['status_final'] == 'FINALIZADO'
        assert data['laudo_tecnico']['placa'] == self.veiculo.placa
        assert data['laudo_tecnico']['veiculo_modelo'] == self.veiculo.modelo
        assert data['laudo_tecnico']['unidade'] == self.ordem.estabelecimento.nome_fantasia
        assert 'data_servico' in data['laudo_tecnico']
        assert 'produtos_utilizados' not in data['laudo_tecnico']

    def test_cliente_nao_acessa_galeria_de_outro_cliente(self):
        outro_cliente = ClienteFactory(telefone_whatsapp='11911110000')
        _auth(self.api, outro_cliente.user)

        resp = self.api.get(self.URL_TEMPLATE.format(self.ordem.id))

        assert resp.status_code == 403

    def test_galeria_nao_finalizada_retorna_400(self):
        self.ordem.status = 'LIBERACAO'
        self.ordem.save(update_fields=['status'])
        _auth(self.api, self.cliente.user)

        resp = self.api.get(self.URL_TEMPLATE.format(self.ordem.id))

        assert resp.status_code == 400
        assert 'finalizadas' in resp.data['errors'][0]['detail']
