import pytest
from rest_framework.test import APIClient

from operacao.models import IncidenteOS
from operacao.tests.factories import GestorFactory, IncidenteOSFactory, OrdemServicoFactory, UserFactory, VistoriaItemFactory


@pytest.mark.django_db
class TestIncidentesAuditoriaAPI:
    def _client(self, user=None):
        client = APIClient()
        if user is not None:
            client.force_authenticate(user=user)
        return client

    def test_gestor_consulta_auditoria_com_dados_consolidados(self):
        gestor = GestorFactory()
        responsavel = UserFactory(
            estabelecimento=gestor.estabelecimento,
            name='Lavador Responsavel',
        )
        os = OrdemServicoFactory(
            estabelecimento=gestor.estabelecimento,
            status='BLOQUEADO_INCIDENTE',
            funcionario=responsavel,
        )
        os.veiculo.nome_dono = 'Cliente Premium'
        os.veiculo.celular_dono = '11999990000'
        os.veiculo.save(update_fields=['nome_dono', 'celular_dono'])
        incidente = IncidenteOSFactory(
            ordem_servico=os,
            status_anterior_os='EM_EXECUCAO',
        )
        vistoria_item = VistoriaItemFactory(
            ordem_servico=os,
            tag_peca=incidente.tag_peca,
        )

        response = self._client(gestor.user).get(f'/api/incidentes-os/{incidente.id}/auditoria/')

        assert response.status_code == 200
        data = response.json()
        assert data['id'] == incidente.id
        assert data['ordem_servico']['id'] == os.id
        assert data['ordem_servico']['status'] == 'BLOQUEADO_INCIDENTE'
        assert data['ordem_servico']['nome_dono'] == 'Cliente Premium'
        assert data['ordem_servico']['celular_dono'] == '11999990000'
        assert data['ordem_servico']['funcionario_responsavel_nome'] == 'Lavador Responsavel'
        assert data['tag_peca']['id'] == incidente.tag_peca.id
        assert data['tag_peca']['nome'] == incidente.tag_peca.nome
        assert data['vistoria_item']['id'] == vistoria_item.id
        assert data['vista_inicial_foto_url'] == response.wsgi_request.build_absolute_uri(vistoria_item.foto_url.url)
        assert data['foto_url'] is not None

    def test_gestor_resolve_incidente_e_retorna_os_ao_fluxo(self):
        gestor = GestorFactory()
        os = OrdemServicoFactory(
            estabelecimento=gestor.estabelecimento,
            status='BLOQUEADO_INCIDENTE',
        )
        incidente = IncidenteOSFactory(
            ordem_servico=os,
            status_anterior_os='LIBERACAO',
            resolvido=False,
        )

        response = self._client(gestor.user).patch(
            f'/api/incidentes-os/{incidente.id}/resolver/',
            {'observacoes_resolucao': 'Falha validada e OS liberada.'},
            format='json',
        )

        assert response.status_code == 200

        os.refresh_from_db()
        incidente.refresh_from_db()
        data = response.json()

        assert incidente.resolvido is True
        assert incidente.gestor_resolucao == gestor.user
        assert os.status == 'LIBERACAO'
        assert data['detail'] == 'Incidente resolvido com sucesso.'
        assert data['ordem_servico_status'] == 'LIBERACAO'

    def test_resolver_sem_nota_retorna_400(self):
        gestor = GestorFactory()
        incidente = IncidenteOSFactory(
            ordem_servico=OrdemServicoFactory(
                estabelecimento=gestor.estabelecimento,
                status='BLOQUEADO_INCIDENTE',
            ),
            status_anterior_os='EM_EXECUCAO',
        )

        response = self._client(gestor.user).patch(
            f'/api/incidentes-os/{incidente.id}/resolver/',
            {'observacoes_resolucao': ''},
            format='json',
        )

        assert response.status_code == 400
        assert response.json()['detail'] == 'A nota de resolução é obrigatória.'

    def test_resolver_incidente_ja_resolvido_retorna_409(self):
        gestor = GestorFactory()
        incidente = IncidenteOSFactory(
            ordem_servico=OrdemServicoFactory(
                estabelecimento=gestor.estabelecimento,
                status='BLOQUEADO_INCIDENTE',
            ),
            status_anterior_os='EM_EXECUCAO',
            resolvido=True,
        )

        response = self._client(gestor.user).patch(
            f'/api/incidentes-os/{incidente.id}/resolver/',
            {'observacoes_resolucao': 'Tentativa duplicada.'},
            format='json',
        )

        assert response.status_code == 409
        assert response.json()['detail'] == 'O incidente informado já foi resolvido.'

    def test_usuario_sem_perfil_gestor_recebe_403_em_auditoria_e_resolucao(self):
        gestor = GestorFactory()
        incidente = IncidenteOSFactory(
            ordem_servico=OrdemServicoFactory(
                estabelecimento=gestor.estabelecimento,
                status='BLOQUEADO_INCIDENTE',
            ),
            status_anterior_os='EM_EXECUCAO',
        )
        funcionario = UserFactory(estabelecimento=gestor.estabelecimento)

        response_auditoria = self._client(funcionario).get(f'/api/incidentes-os/{incidente.id}/auditoria/')
        response_resolucao = self._client(funcionario).patch(
            f'/api/incidentes-os/{incidente.id}/resolver/',
            {'observacoes_resolucao': 'Nao deveria passar.'},
            format='json',
        )

        assert response_auditoria.status_code == 403
        assert response_resolucao.status_code == 403

    def test_gestor_de_outro_estabelecimento_recebe_403(self):
        gestor = GestorFactory()
        outro_gestor = GestorFactory()
        incidente = IncidenteOSFactory(
            ordem_servico=OrdemServicoFactory(
                estabelecimento=outro_gestor.estabelecimento,
                status='BLOQUEADO_INCIDENTE',
            ),
            status_anterior_os='EM_EXECUCAO',
        )

        response = self._client(gestor.user).get(f'/api/incidentes-os/{incidente.id}/auditoria/')

        assert response.status_code == 403
