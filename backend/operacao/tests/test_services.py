import io

import pytest
from PIL import Image
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile

from operacao.models import IncidenteOS, OrdemServico
from operacao.services import IncidenteService, MidiaOrdemServicoService, OrdemServicoService
from operacao.tests.factories import MidiaOrdemServicoFactory, OrdemServicoFactory, TagPecaFactory


def gerar_foto_valida(nome='foto.jpg'):
    """Gera um buffer de imagem 1x1 pixel valida para o PIL."""
    buf = io.BytesIO()
    Image.new('RGB', (1, 1), color='white').save(buf, format='JPEG')
    buf.seek(0)
    return SimpleUploadedFile(nome, buf.read(), content_type='image/jpeg')


@pytest.mark.django_db
class TestOrdemServicoServiceEtapas:
    def test_deve_avancar_vistoria_para_execucao_com_fotos_obrigatorias(self):
        """RN-09: Com 5 fotos ENTRADA, deve avancar de PATIO para VISTORIA_INICIAL."""
        os = OrdemServicoFactory(status='PATIO')
        for _ in range(5):
            MidiaOrdemServicoFactory(ordem_servico=os, momento='ENTRADA')

        dados = {'laudo_vistoria': 'Veiculo em bom estado'}
        os_atualizada = OrdemServicoService.avancar_etapa(os.id, dados)

        assert os_atualizada.status == 'VISTORIA_INICIAL'
        assert os_atualizada.laudo_vistoria == 'Veiculo em bom estado'
        assert os_atualizada.horario_lavagem is None

    def test_deve_avancar_vistoria_inicial_para_em_execucao(self):
        """Kanban fix: VISTORIA_INICIAL -> EM_EXECUCAO ao iniciar lavagem."""
        os = OrdemServicoFactory(status='VISTORIA_INICIAL')

        os_atualizada = OrdemServicoService.avancar_etapa(os.id, {})

        assert os_atualizada.status == 'EM_EXECUCAO'
        assert os_atualizada.horario_lavagem is not None

    def test_fluxo_completo_patio_ate_liberacao(self):
        """Garante que o fluxo de 4 etapas finaliza em LIBERACAO sem pular status."""
        os = OrdemServicoFactory(status='PATIO')
        for _ in range(5):
            MidiaOrdemServicoFactory(ordem_servico=os, momento='ENTRADA')

        os = OrdemServicoService.avancar_etapa(os.id, {})
        assert os.status == 'VISTORIA_INICIAL'

        os = OrdemServicoService.avancar_etapa(os.id, {})
        assert os.status == 'EM_EXECUCAO'
        assert os.horario_lavagem is not None

        os = OrdemServicoService.avancar_etapa(os.id, {})
        assert os.status == 'EM_EXECUCAO'
        assert os.horario_acabamento is not None

        os = OrdemServicoService.avancar_etapa(os.id, {'comentario_acabamento': 'OK'})
        assert os.status == 'LIBERACAO'

    def test_nao_deve_avancar_vistoria_sem_cinco_fotos(self):
        """RN-09: Com menos de 5 fotos, deve recusar o avanco de etapa."""
        os = OrdemServicoFactory(status='PATIO')
        MidiaOrdemServicoFactory(ordem_servico=os, momento='ENTRADA')
        MidiaOrdemServicoFactory(ordem_servico=os, momento='ENTRADA')

        with pytest.raises(ValueError) as exc:
            OrdemServicoService.avancar_etapa(os.id, {})
        assert 'mínimo de 5 fotos' in str(exc.value)

    def test_upload_liberacao_aceita_finalizado(self):
        """Sucesso: deve permitir upload de fotos FINALIZACAO quando o status e LIBERACAO."""
        os = OrdemServicoFactory(status='LIBERACAO')
        foto = gerar_foto_valida()

        midias = MidiaOrdemServicoService.processar_upload_multiplo(os, 'FINALIZACAO', [foto])
        assert len(midias) == 1
        assert midias[0].momento == 'FINALIZACAO'

    def test_upload_liberacao_bloqueia_vistoria(self):
        """Nao deve permitir fotos de vistoria na fase de liberacao."""
        os = OrdemServicoFactory(status='LIBERACAO')
        foto = gerar_foto_valida()

        with pytest.raises(ValidationError) as exc:
            MidiaOrdemServicoService.processar_upload_multiplo(os, 'ENTRADA', [foto])
        assert 'não é permitido' in str(exc.value)

    def test_upload_bloqueado_em_finalizado(self):
        """Nao deve permitir upload apos a OS estar FINALIZACAO."""
        os = OrdemServicoFactory(status='FINALIZADO')
        foto = gerar_foto_valida()

        with pytest.raises(ValidationError):
            MidiaOrdemServicoService.processar_upload_multiplo(os, 'FINALIZACAO', [foto])


@pytest.mark.django_db
class TestIncidenteServiceRegistro:
    def test_deve_registrar_incidente_salvando_status_anterior_e_bloqueando_os(self):
        os = OrdemServicoFactory(status='EM_EXECUCAO')
        tag_peca = TagPecaFactory(estabelecimento=os.estabelecimento)
        foto = gerar_foto_valida()

        incidente = IncidenteService.registrar_incidente(
            os_id=os.id,
            dados={
                'descricao': 'Risco identificado na lateral.',
                'tag_peca_id': tag_peca.id,
            },
            arquivo_foto=foto,
        )

        os.refresh_from_db()

        assert incidente.status_anterior_os == 'EM_EXECUCAO'
        assert incidente.ordem_servico_id == os.id
        assert incidente.tag_peca_id == tag_peca.id
        assert os.status == 'BLOQUEADO_INCIDENTE'
        assert IncidenteOS.objects.filter(id=incidente.id).exists()
