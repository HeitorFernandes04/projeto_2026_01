import pytest
import io
from PIL import Image
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError

from operacao.services import OrdemServicoService, MidiaOrdemServicoService
from operacao.tests.factories import OrdemServicoFactory, MidiaOrdemServicoFactory
# Imports ajustados conforme nova estrutura
from core.models import Servico, Veiculo
from operacao.models import OrdemServico

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
        assert os_atualizada.horario_lavagem is None  # horario_lavagem só é marcado ao iniciar lavagem (ETAPA 2)

    def test_deve_avancar_vistoria_inicial_para_em_execucao(self):
        """Kanban fix: VISTORIA_INICIAL → EM_EXECUCAO ao iniciar lavagem."""
        os = OrdemServicoFactory(status='VISTORIA_INICIAL')

        os_atualizada = OrdemServicoService.avancar_etapa(os.id, {})

        assert os_atualizada.status == 'EM_EXECUCAO'
        assert os_atualizada.horario_lavagem is not None

    def test_fluxo_completo_patio_ate_liberacao(self):
        """Garante que o fluxo de 4 etapas finaliza em LIBERACAO sem pular status."""
        os = OrdemServicoFactory(status='PATIO')
        for _ in range(5):
            MidiaOrdemServicoFactory(ordem_servico=os, momento='VISTORIA_GERAL')

        # ETAPA 1
        os = OrdemServicoService.avancar_etapa(os.id, {})
        assert os.status == 'VISTORIA_INICIAL'

        # ETAPA 2
        os = OrdemServicoService.avancar_etapa(os.id, {})
        assert os.status == 'EM_EXECUCAO'
        assert os.horario_lavagem is not None

        # ETAPA 3 (sub-fase acabamento, status permanece EM_EXECUCAO)
        os = OrdemServicoService.avancar_etapa(os.id, {})
        assert os.status == 'EM_EXECUCAO'
        assert os.horario_acabamento is not None

        # ETAPA 4
        os = OrdemServicoService.avancar_etapa(os.id, {'comentario_acabamento': 'OK'})
        assert os.status == 'LIBERACAO'

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