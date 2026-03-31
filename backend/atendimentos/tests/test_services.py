"""
Testes unitários para a camada de serviço — RF-05: Upload de fotos antes do atendimento.
"""
from io import BytesIO

from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from PIL import Image

from accounts.models import User
from atendimentos.models import Atendimento, MidiaAtendimento, Servico, Veiculo
from atendimentos.services import MidiaAtendimentoService


def _criar_imagem_fake(nome='foto.jpg'):
    """Gera um SimpleUploadedFile com uma imagem JPEG válida de 10x10."""
    buffer = BytesIO()
    Image.new('RGB', (10, 10), color='red').save(buffer, format='JPEG')
    buffer.seek(0)
    return SimpleUploadedFile(nome, buffer.read(), content_type='image/jpeg')


class TestMidiaAtendimentoService(TestCase):
    """Testes para MidiaAtendimentoService.processar_upload_multiplo"""

    def setUp(self):
        self.funcionario = User.objects.create_user(
            username='func1',
            email='func1@lava.me',
            password='senha12345',
        )
        self.servico = Servico.objects.create(
            nome='Lavagem Simples',
            preco=50.00,
            duracao_estimada_min=30,
        )
        self.veiculo = Veiculo.objects.create(
            placa='ABC1D23',
            modelo='Gol',
            marca='VW',
            nome_dono='João',
        )
        self.atendimento = Atendimento.objects.create(
            veiculo=self.veiculo,
            servico=self.servico,
            funcionario=self.funcionario,
            data_hora=timezone.now(),
            status='agendado',
        )

    # -------------------------------------------------------------------
    # Cenários de Sucesso
    # -------------------------------------------------------------------

    def test_upload_multiplo_sucesso_agendado(self):
        """Upload de 2 fotos com momento='ANTES' para atendimento AGENDADO deve criar 2 registros."""
        arquivos = [_criar_imagem_fake('foto1.jpg'), _criar_imagem_fake('foto2.jpg')]

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

        arquivos = [_criar_imagem_fake()]

        midias = MidiaAtendimentoService.processar_upload_multiplo(
            atendimento=self.atendimento,
            momento='ANTES',
            arquivos=arquivos,
        )

        self.assertEqual(len(midias), 1)

    # -------------------------------------------------------------------
    # Cenários de Falha — Ciclo de Vida
    # -------------------------------------------------------------------

    def test_upload_atendimento_cancelado_falha(self):
        """Upload para atendimento CANCELADO deve levantar ValidationError."""
        self.atendimento.status = 'cancelado'
        self.atendimento.save()

        arquivos = [_criar_imagem_fake()]

        with self.assertRaises(ValidationError) as ctx:
            MidiaAtendimentoService.processar_upload_multiplo(
                atendimento=self.atendimento,
                momento='ANTES',
                arquivos=arquivos,
            )

        self.assertIn('status', str(ctx.exception).lower())

    def test_upload_atendimento_finalizado_falha(self):
        """Upload para atendimento FINALIZADO deve levantar ValidationError."""
        self.atendimento.status = 'finalizado'
        self.atendimento.save()

        arquivos = [_criar_imagem_fake()]

        with self.assertRaises(ValidationError) as ctx:
            MidiaAtendimentoService.processar_upload_multiplo(
                atendimento=self.atendimento,
                momento='ANTES',
                arquivos=arquivos,
            )

        self.assertIn('status', str(ctx.exception).lower())
