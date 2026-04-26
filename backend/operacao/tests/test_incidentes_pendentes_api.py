import pytest
from rest_framework.test import APIClient

from operacao.tests.factories import EstabelecimentoFactory, GestorFactory, IncidenteOSFactory, OrdemServicoFactory, UserFactory


@pytest.mark.django_db
class TestIncidentesPendentesAPI:
    URL = '/api/incidentes-os/pendentes/'

    def _client(self, user=None):
        client = APIClient()
        if user is not None:
            client.force_authenticate(user=user)
        return client

    def test_gestor_lista_apenas_incidentes_pendentes_de_os_bloqueadas(self):
        gestor = GestorFactory()
        outro_gestor = GestorFactory()

        os_bloqueada = OrdemServicoFactory(
            estabelecimento=gestor.estabelecimento,
            status='BLOQUEADO_INCIDENTE',
        )
        os_nao_bloqueada = OrdemServicoFactory(
            estabelecimento=gestor.estabelecimento,
            status='EM_EXECUCAO',
        )
        os_outro_estabelecimento = OrdemServicoFactory(
            estabelecimento=outro_gestor.estabelecimento,
            status='BLOQUEADO_INCIDENTE',
        )

        incidente_pendente = IncidenteOSFactory(
            ordem_servico=os_bloqueada,
            resolvido=False,
        )
        IncidenteOSFactory(
            ordem_servico=os_bloqueada,
            resolvido=True,
        )
        IncidenteOSFactory(
            ordem_servico=os_nao_bloqueada,
            resolvido=False,
        )
        IncidenteOSFactory(
            ordem_servico=os_outro_estabelecimento,
            resolvido=False,
        )

        response = self._client(gestor.user).get(self.URL)

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]['id'] == incidente_pendente.id
        assert data[0]['ordem_servico_id'] == os_bloqueada.id
        assert data[0]['status_ordem_servico'] == 'BLOQUEADO_INCIDENTE'
        assert data[0]['placa'].startswith('TST-')
        assert data[0]['modelo'] == os_bloqueada.veiculo.modelo
        assert data[0]['servico'] == os_bloqueada.servico.nome
        assert data[0]['tag_peca'] == incidente_pendente.tag_peca.nome
        assert data[0]['descricao'] == incidente_pendente.descricao
        assert data[0]['foto_url'] is not None

    def test_funcionario_recebe_403(self):
        funcionario = UserFactory(estabelecimento=EstabelecimentoFactory())

        response = self._client(funcionario).get(self.URL)

        assert response.status_code == 403

    def test_sem_autenticacao_recebe_401(self):
        response = self._client().get(self.URL)

        assert response.status_code == 401
