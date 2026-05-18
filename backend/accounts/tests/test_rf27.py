"""
RF-27 — Core e Banco de Dados (Refatoração de Modelos)
TDD: Estes testes devem falhar antes da implementação (Red) e passar após (Green).
"""
from django.test import TestCase
from django.core.exceptions import ValidationError

from accounts.models import CargoChoices
from accounts.serializers import FuncionarioSerializer
from operacao.tests.factories import EstabelecimentoFactory, OrdemServicoFactory


class RF27GeolocalizacaoTest(TestCase):
    """RF-27.1 — Geolocalização do Estabelecimento."""

    def test_latitude_longitude_aceita_valores_validos(self):
        est = EstabelecimentoFactory(latitude=-23.5505, longitude=-46.6333)
        est.refresh_from_db()
        self.assertAlmostEqual(est.latitude, -23.5505, places=4)
        self.assertAlmostEqual(est.longitude, -46.6333, places=4)

    def test_latitude_longitude_sao_opcionais(self):
        est = EstabelecimentoFactory()
        est.refresh_from_db()
        self.assertIsNone(est.latitude)
        self.assertIsNone(est.longitude)


class RF27EtapaAtualTest(TestCase):
    """RF-27.2 — Campo etapa_atual (0-100) em OrdemServico."""

    def test_etapa_atual_default_zero(self):
        os = OrdemServicoFactory()
        self.assertEqual(os.etapa_atual, 0)

    def test_etapa_atual_aceita_valor_valido(self):
        os = OrdemServicoFactory(etapa_atual=50)
        os.refresh_from_db()
        self.assertEqual(os.etapa_atual, 50)

    def test_etapa_atual_rejeita_valor_acima_de_100(self):
        os = OrdemServicoFactory()
        os.etapa_atual = 150
        with self.assertRaises(ValidationError):
            os.full_clean()

    def test_etapa_atual_aceita_limites_extremos(self):
        os_zero = OrdemServicoFactory(etapa_atual=0)
        os_cem = OrdemServicoFactory(etapa_atual=100)
        os_zero.refresh_from_db()
        os_cem.refresh_from_db()
        self.assertEqual(os_zero.etapa_atual, 0)
        self.assertEqual(os_cem.etapa_atual, 100)


class RF27RemocaoCamposAcabamentoTest(TestCase):
    """RF-27.3 — horario_acabamento e comentario_acabamento removidos de OrdemServico."""

    def test_horario_acabamento_nao_existe_no_model(self):
        os = OrdemServicoFactory()
        self.assertFalse(
            hasattr(os, 'horario_acabamento'),
            "horario_acabamento ainda existe no model — deve ser removido (RF-27.3)",
        )

    def test_comentario_acabamento_nao_existe_no_model(self):
        os = OrdemServicoFactory()
        self.assertFalse(
            hasattr(os, 'comentario_acabamento'),
            "comentario_acabamento ainda existe no model — deve ser removido (RF-27.3)",
        )


class RF27SaneamentoCargosTest(TestCase):
    """RF-27.4 — DETALHISTA removido de CargoChoices."""

    def test_detalhista_nao_esta_nas_choices(self):
        valores = [c[0] for c in CargoChoices.choices]
        self.assertNotIn(
            'DETALHISTA',
            valores,
            "Cargo DETALHISTA ainda existe em CargoChoices — deve ser removido (RF-27.4)",
        )

    def test_cargo_detalhista_invalido_no_serializer(self):
        est = EstabelecimentoFactory()
        data = {
            'name': 'Func Teste',
            'email': 'func_det@test.com',
            'password': 'senha12345',
            'estabelecimento': est.id,
            'cargo': 'DETALHISTA',
        }
        serializer = FuncionarioSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('cargo', serializer.errors)
