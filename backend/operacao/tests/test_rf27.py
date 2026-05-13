"""
RF-27 — Testes de integração: state machine sem ACABAMENTO, validators de geo,
e validação do serializer para etapa_atual.
Complementam accounts/tests/test_rf27.py (que cobre testes unitários de model).
"""
import pytest
from django.core.exceptions import ValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError

from operacao.models import OrdemServico
from operacao.serializers import OrdemServicoSerializer
from operacao.services import OrdemServicoService
from operacao.tests.factories import EstabelecimentoFactory, MidiaOrdemServicoFactory, OrdemServicoFactory


# ---------------------------------------------------------------------------
# RF-27 / RF-30 — State machine: EM_EXECUCAO vai direto para LIBERACAO
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestStateMachineSemAcabamento:
    def test_acabamento_nao_e_status_valido(self):
        status_validos = [s for s, _ in OrdemServico.STATUS_CHOICES]
        assert 'ACABAMENTO' not in status_validos

    def test_fluxo_completo_patio_ate_liberacao_sem_acabamento(self):
        os = OrdemServicoFactory(status='PATIO')
        for _ in range(5):
            MidiaOrdemServicoFactory(ordem_servico=os, momento='VISTORIA_GERAL')

        os = OrdemServicoService.avancar_etapa(os.id, {})
        assert os.status == 'VISTORIA_INICIAL'

        os = OrdemServicoService.avancar_etapa(os.id, {})
        assert os.status == 'EM_EXECUCAO'

        os = OrdemServicoService.avancar_etapa(os.id, {})
        assert os.status == 'LIBERACAO'

    def test_em_execucao_transiciona_direto_para_liberacao(self):
        os = OrdemServicoFactory(status='EM_EXECUCAO')
        os_atualizada = OrdemServicoService.avancar_etapa(os.id, {})
        assert os_atualizada.status == 'LIBERACAO'

    def test_avancar_em_liberacao_levanta_value_error(self):
        """LIBERACAO não tem próxima etapa — avancar_etapa deve lançar ValueError."""
        os = OrdemServicoFactory(status='LIBERACAO')
        with pytest.raises(ValueError, match="LIBERACAO"):
            OrdemServicoService.avancar_etapa(os.id, {})


# ---------------------------------------------------------------------------
# RF-27.2 — Serializer: validate_etapa_atual
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestSerializerEtapaAtual:
    def _serializer_com_valor(self, os, valor):
        return OrdemServicoSerializer(os, data={'etapa_atual': valor}, partial=True)

    def test_etapa_atual_101_invalido_no_serializer(self):
        os = OrdemServicoFactory()
        s = self._serializer_com_valor(os, 101)
        assert not s.is_valid()
        assert 'etapa_atual' in s.errors

    def test_etapa_atual_negativo_invalido_no_serializer(self):
        os = OrdemServicoFactory()
        s = self._serializer_com_valor(os, -1)
        assert not s.is_valid()
        assert 'etapa_atual' in s.errors

    def test_etapa_atual_100_valido_no_serializer(self):
        os = OrdemServicoFactory()
        s = self._serializer_com_valor(os, 100)
        assert s.is_valid(), s.errors

    def test_etapa_atual_0_valido_no_serializer(self):
        os = OrdemServicoFactory()
        s = self._serializer_com_valor(os, 0)
        assert s.is_valid(), s.errors


# ---------------------------------------------------------------------------
# RF-27.1 — Geolocalização: coordenadas inválidas devem falhar em full_clean()
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestGeolocalizacaoValidadores:
    def test_latitude_acima_de_90_levanta_validation_error(self):
        est = EstabelecimentoFactory(latitude=91.0, longitude=0.0)
        with pytest.raises(ValidationError):
            est.full_clean()

    def test_latitude_abaixo_de_menos_90_levanta_validation_error(self):
        est = EstabelecimentoFactory(latitude=-91.0, longitude=0.0)
        with pytest.raises(ValidationError):
            est.full_clean()

    def test_longitude_acima_de_180_levanta_validation_error(self):
        est = EstabelecimentoFactory(latitude=0.0, longitude=181.0)
        with pytest.raises(ValidationError):
            est.full_clean()

    def test_longitude_abaixo_de_menos_180_levanta_validation_error(self):
        est = EstabelecimentoFactory(latitude=0.0, longitude=-181.0)
        with pytest.raises(ValidationError):
            est.full_clean()

    def test_coordenadas_fronteira_sao_validas(self):
        est = EstabelecimentoFactory(latitude=90.0, longitude=180.0)
        est.full_clean()

        est2 = EstabelecimentoFactory(latitude=-90.0, longitude=-180.0)
        est2.full_clean()
