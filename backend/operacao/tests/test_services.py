import pytest
import io
from PIL import Image
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError

from operacao.services import OrdemServicoService, MidiaOrdemServicoService, IncidenteService
from operacao.tests.factories import OrdemServicoFactory, MidiaOrdemServicoFactory, IncidenteOSFactory, GestorFactory
# Imports ajustados conforme nova estrutura
from core.models import Servico, Veiculo
from operacao.models import OrdemServico, IncidenteOS

def gerar_foto_valida(nome="foto.jpg"):
    """Gera um buffer de imagem 1x1 pixel válida para o PIL."""
    buf = io.BytesIO()
    Image.new('RGB', (1, 1), color='white').save(buf, format='JPEG')
    buf.seek(0)
    return SimpleUploadedFile(nome, buf.read(), content_type='image/jpeg')

@pytest.mark.django_db
class TestOrdemServicoServiceEtapas:

    def test_deve_avancar_vistoria_para_execucao_com_fotos_obrigatorias(self):
        """RN-09: Com 5 fotos VISTORIA_GERAL, deve avançar de PATIO para VISTORIA_INICIAL."""
        os = OrdemServicoFactory(status='PATIO')
        for _ in range(5):
            MidiaOrdemServicoFactory(ordem_servico=os, momento='VISTORIA_GERAL')

        dados = {'laudo_vistoria': 'Veículo em bom estado'}
        os_atualizada = OrdemServicoService.avancar_etapa(os.id, dados)

        assert os_atualizada.status == 'VISTORIA_INICIAL'
        assert os_atualizada.laudo_vistoria == 'Veículo em bom estado'
        assert os_atualizada.horario_lavagem is not None

    def test_nao_deve_avancar_vistoria_sem_cinco_fotos(self):
        """RN-09: Com menos de 5 fotos, deve recusar o avanço de etapa."""
        os = OrdemServicoFactory(status='PATIO')
        MidiaOrdemServicoFactory(ordem_servico=os, momento='VISTORIA_GERAL')
        MidiaOrdemServicoFactory(ordem_servico=os, momento='VISTORIA_GERAL')

        with pytest.raises(ValueError) as exc:
            OrdemServicoService.avancar_etapa(os.id, {})
        assert "mínimo de 5 fotos" in str(exc.value)

    def test_upload_liberacao_aceita_finalizado(self):
        """Sucesso: Deve permitir upload de fotos FINALIZADO quando o status é LIBERACAO."""
        os = OrdemServicoFactory(status='LIBERACAO')
        foto = gerar_foto_valida()
        
        midias = MidiaOrdemServicoService.processar_upload_multiplo(os, 'FINALIZADO', [foto])
        assert len(midias) == 1
        assert midias[0].momento == 'FINALIZADO'

    def test_upload_liberacao_bloqueia_vistoria(self):
        """Neutralização de Viés: Não deve permitir fotos de Vistoria na fase de Liberação."""
        os = OrdemServicoFactory(status='LIBERACAO')
        foto = gerar_foto_valida()
        
        with pytest.raises(ValidationError) as exc:
            MidiaOrdemServicoService.processar_upload_multiplo(os, 'VISTORIA_GERAL', [foto])
        assert 'não é permitido' in str(exc.value)

    def test_upload_bloqueado_em_finalizado(self):
        """Segurança: Não deve permitir upload após a OS estar FINALIZADO."""
        os = OrdemServicoFactory(status='FINALIZADO')
        foto = gerar_foto_valida()
        
        with pytest.raises(ValidationError):
            MidiaOrdemServicoService.processar_upload_multiplo(os, 'FINALIZADO', [foto])


@pytest.mark.django_db
class TestIncidenteServiceAuditoria:

    def test_listar_pendentes_retorna_apenas_os_bloqueadas_do_estabelecimento_do_gestor(self):
        gestor = GestorFactory()
        os_bloqueada = OrdemServicoFactory(
            estabelecimento=gestor.estabelecimento,
            status='BLOQUEADO_INCIDENTE',
        )
        incidente_pendente = IncidenteOSFactory(
            ordem_servico=os_bloqueada,
            resolvido=False,
            status_anterior_os='EM_EXECUCAO',
        )
        IncidenteOSFactory(
            ordem_servico=OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='EM_EXECUCAO'),
            resolvido=False,
        )
        IncidenteOSFactory(
            ordem_servico=OrdemServicoFactory(status='BLOQUEADO_INCIDENTE'),
            resolvido=False,
        )

        pendentes = list(IncidenteService.listar_pendentes(gestor.user))

        assert pendentes == [incidente_pendente]

    def test_resolver_incidente_desbloqueia_os_para_status_anterior_e_registra_auditoria(self):
        gestor = GestorFactory()
        ordem_servico = OrdemServicoFactory(
            estabelecimento=gestor.estabelecimento,
            status='BLOQUEADO_INCIDENTE',
        )
        incidente = IncidenteOSFactory(
            ordem_servico=ordem_servico,
            resolvido=False,
            status_anterior_os='LIBERACAO',
        )

        incidente_resolvido = IncidenteService.resolver_incidente(
            gestor.user,
            incidente.id,
            'Cliente ciente e continuidade liberada.',
        )

        ordem_servico.refresh_from_db()
        incidente_resolvido.refresh_from_db()
        assert incidente_resolvido.resolvido is True
        assert incidente_resolvido.observacoes_resolucao == 'Cliente ciente e continuidade liberada.'
        assert incidente_resolvido.gestor_resolucao == gestor.user
        assert incidente_resolvido.data_resolucao is not None
        assert ordem_servico.status == 'LIBERACAO'

    def test_resolver_incidente_sem_nota_deve_falhar(self):
        gestor = GestorFactory()
        incidente = IncidenteOSFactory(
            ordem_servico=OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='BLOQUEADO_INCIDENTE'),
        )

        with pytest.raises(ValidationError) as exc:
            IncidenteService.resolver_incidente(gestor.user, incidente.id, '   ')

        assert 'A nota de resolução é obrigatória.' in str(exc.value)
        assert IncidenteOS.objects.get(id=incidente.id).resolvido is False

    def test_resolver_incidente_ja_resolvido_deve_falhar_com_conflito_de_negocio(self):
        gestor = GestorFactory()
        incidente = IncidenteOSFactory(
            ordem_servico=OrdemServicoFactory(estabelecimento=gestor.estabelecimento, status='BLOQUEADO_INCIDENTE'),
            resolvido=True,
        )

        with pytest.raises(ValueError) as exc:
            IncidenteService.resolver_incidente(gestor.user, incidente.id, 'Nova tentativa')

        assert 'O incidente informado já foi resolvido.' in str(exc.value)
