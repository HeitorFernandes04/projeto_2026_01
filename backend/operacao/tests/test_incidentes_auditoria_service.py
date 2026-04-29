import pytest
from django.core.exceptions import PermissionDenied, ValidationError
from django.utils import timezone

from operacao.services import IncidenteService
from operacao.tests.factories import GestorFactory, IncidenteOSFactory, OrdemServicoFactory, UserFactory, VistoriaItemFactory


@pytest.mark.django_db
class TestIncidenteServiceAuditoria:
    def test_detalhar_auditoria_retorna_dados_consolidados(self):
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
            possui_avaria=True,
        )

        auditoria = IncidenteService.detalhar_auditoria(incidente.id, gestor.estabelecimento)

        assert auditoria == incidente
        assert auditoria.ordem_servico_id == os.id
        assert auditoria.status_anterior_os == 'EM_EXECUCAO'
        assert auditoria.vistoria_item_auditavel == vistoria_item
        assert auditoria.ordem_servico.veiculo.nome_dono == 'Cliente Premium'
        assert auditoria.ordem_servico.veiculo.celular_dono == '11999990000'
        assert auditoria.ordem_servico.funcionario == responsavel

    def test_detalhar_auditoria_bloqueia_outro_estabelecimento(self):
        gestor = GestorFactory()
        outro_gestor = GestorFactory()
        incidente = IncidenteOSFactory(
            ordem_servico=OrdemServicoFactory(
                estabelecimento=outro_gestor.estabelecimento,
                status='BLOQUEADO_INCIDENTE',
            )
        )

        with pytest.raises(PermissionDenied):
            IncidenteService.detalhar_auditoria(incidente.id, gestor.estabelecimento)

    def test_resolver_incidente_restabelece_status_anterior_e_audita_gestor(self):
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

        resolvido = IncidenteService.resolver_incidente(
            incidente_id=incidente.id,
            estabelecimento=gestor.estabelecimento,
            gestor_user=gestor.user,
            observacoes_resolucao='Conferido com a vistoria de entrada.',
        )

        os.refresh_from_db()
        resolvido.refresh_from_db()

        assert resolvido.resolvido is True
        assert resolvido.observacoes_resolucao == 'Conferido com a vistoria de entrada.'
        assert resolvido.gestor_resolucao == gestor.user
        assert resolvido.data_resolucao is not None
        assert timezone.is_aware(resolvido.data_resolucao)
        assert os.status == 'LIBERACAO'

    def test_resolver_incidente_sem_nota_retorna_erro(self):
        gestor = GestorFactory()
        incidente = IncidenteOSFactory(
            ordem_servico=OrdemServicoFactory(
                estabelecimento=gestor.estabelecimento,
                status='BLOQUEADO_INCIDENTE',
            ),
            status_anterior_os='EM_EXECUCAO',
        )

        with pytest.raises(ValidationError) as exc:
            IncidenteService.resolver_incidente(
                incidente_id=incidente.id,
                estabelecimento=gestor.estabelecimento,
                gestor_user=gestor.user,
                observacoes_resolucao='   ',
            )

        assert 'A nota de resolução é obrigatória.' in str(exc.value)

    def test_resolver_incidente_ja_resolvido_retorna_conflito(self):
        gestor = GestorFactory()
        incidente = IncidenteOSFactory(
            ordem_servico=OrdemServicoFactory(
                estabelecimento=gestor.estabelecimento,
                status='BLOQUEADO_INCIDENTE',
            ),
            status_anterior_os='EM_EXECUCAO',
            resolvido=True,
        )

        with pytest.raises(IncidenteService.IncidenteJaResolvidoError) as exc:
            IncidenteService.resolver_incidente(
                incidente_id=incidente.id,
                estabelecimento=gestor.estabelecimento,
                gestor_user=gestor.user,
                observacoes_resolucao='Nao deveria resolver de novo.',
            )

        assert 'O incidente informado já foi resolvido.' in str(exc.value)
