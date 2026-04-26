import pytest

from operacao.services import IncidenteService
from operacao.tests.factories import GestorFactory, IncidenteOSFactory, OrdemServicoFactory


@pytest.mark.django_db
class TestIncidenteServicePendentes:
    def test_lista_apenas_incidentes_abertos_de_os_bloqueadas_do_estabelecimento(self):
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

        incidentes = list(IncidenteService.listar_pendentes(gestor.estabelecimento))

        assert incidentes == [incidente_pendente]
