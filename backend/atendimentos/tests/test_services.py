"""
Testes unitários para a camada de serviço — RF-05: Upload de fotos antes do atendimento.
"""
from django.core.exceptions import ValidationError
from django.test import TestCase

from atendimentos.models import MidiaAtendimento
from atendimentos.services import MidiaAtendimentoService
from atendimentos.tests.factories import AtendimentoFactory, criar_imagem_fake


class TestMidiaAtendimentoService(TestCase):
    """Testes para MidiaAtendimentoService.processar_upload_multiplo"""

    def setUp(self):
        self.atendimento = AtendimentoFactory(status='agendado')

    # -------------------------------------------------------------------
    # Cenários de Sucesso
    # -------------------------------------------------------------------

    def test_upload_multiplo_sucesso_agendado(self):
        """Upload de 2 fotos com momento='ANTES' para atendimento AGENDADO deve criar 2 registros."""
        arquivos = [criar_imagem_fake('foto1.jpg'), criar_imagem_fake('foto2.jpg')]

        midias = MidiaAtendimentoService.processar_upload_multiplo(
            atendimento=self.atendimento,
            momento='ANTES',
            arquivos=arquivos,
        )

        self.assertEqual(len(midias), 2)
        self.assertEqual(MidiaAtendimento.objects.filter(atendimento=self.atendimento).count(), 2)
        for midia in midias:
            self.assertEqual(midia.momento, 'ANTES')
            self.assertTrue(midia.arquivo.name.startswith('atendimentos/'))

    def test_upload_atendimento_em_andamento_sucesso(self):
        """Upload deve funcionar quando status é EM_ANDAMENTO."""
        self.atendimento.status = 'em_andamento'
        self.atendimento.save()

        midias = MidiaAtendimentoService.processar_upload_multiplo(
            atendimento=self.atendimento,
            momento='ANTES',
            arquivos=[criar_imagem_fake()],
        )

        self.assertEqual(len(midias), 1)

    # -------------------------------------------------------------------
    # Cenários de Falha — Ciclo de Vida
    # -------------------------------------------------------------------

    def test_upload_atendimento_cancelado_falha(self):
        """Upload para atendimento CANCELADO deve levantar ValidationError."""
        self.atendimento.status = 'cancelado'
        self.atendimento.save()

        with self.assertRaises(ValidationError) as ctx:
            MidiaAtendimentoService.processar_upload_multiplo(
                atendimento=self.atendimento,
                momento='ANTES',
                arquivos=[criar_imagem_fake()],
            )

        self.assertIn('status', str(ctx.exception).lower())

    def test_upload_atendimento_finalizado_falha(self):
        """Upload para atendimento FINALIZADO deve levantar ValidationError."""
        self.atendimento.status = 'finalizado'
        self.atendimento.save()

        with self.assertRaises(ValidationError) as ctx:
            MidiaAtendimentoService.processar_upload_multiplo(
                atendimento=self.atendimento,
                momento='ANTES',
                arquivos=[criar_imagem_fake()],
            )

        self.assertIn('status', str(ctx.exception).lower())
