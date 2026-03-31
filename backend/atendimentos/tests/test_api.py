"""
Testes de integração para a API REST — RF-05: Upload de fotos antes do atendimento.
Testa o contrato HTTP: status codes, permissões, formato de resposta.
"""
from io import BytesIO

from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from atendimentos.models import Atendimento, Servico, Veiculo

# Usa diretório temporário para não poluir o media/ real
import tempfile

TEMP_MEDIA = tempfile.mkdtemp()


def _criar_imagem_fake(nome='foto.jpg'):
    """Gera bytes de uma imagem JPEG válida de 10x10."""
    buffer = BytesIO()
    Image.new('RGB', (10, 10), color='blue').save(buffer, format='JPEG')
    buffer.seek(0)
    buffer.name = nome
    return buffer


@override_settings(MEDIA_ROOT=TEMP_MEDIA)
class TestFotoUploadAPI(TestCase):
    """Testes de integração para POST /api/atendimentos/{id}/fotos/"""

    def setUp(self):
        # Funcionário vinculado ao atendimento
        self.funcionario = User.objects.create_user(
            username='func_vinculado',
            email='func@lava.me',
            password='senha12345',
        )
        # Outro funcionário (para teste IDOR)
        self.outro_funcionario = User.objects.create_user(
            username='func_outro',
            email='outro@lava.me',
            password='senha12345',
        )

        self.servico = Servico.objects.create(
            nome='Lavagem Completa',
            preco=80.00,
            duracao_estimada_min=60,
        )
        self.veiculo = Veiculo.objects.create(
            placa='XYZ9A88',
            modelo='Civic',
            marca='Honda',
            nome_dono='Maria',
        )
        self.atendimento = Atendimento.objects.create(
            veiculo=self.veiculo,
            servico=self.servico,
            funcionario=self.funcionario,
            data_hora=timezone.now(),
            status='agendado',
        )

        self.client = APIClient()
        self.url = reverse('atendimento-fotos', kwargs={'pk': self.atendimento.pk})

    # -------------------------------------------------------------------
    # Cenário de Sucesso
    # -------------------------------------------------------------------

    def test_upload_fotos_funcionario_vinculado_201(self):
        """Funcionário vinculado faz upload de 2 fotos com momento=ANTES → 201."""
        self.client.force_authenticate(user=self.funcionario)

        foto1 = _criar_imagem_fake('foto1.jpg')
        foto2 = _criar_imagem_fake('foto2.jpg')

        response = self.client.post(
            self.url,
            data={'momento': 'ANTES', 'arquivos': [foto1, foto2]},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data), 2)

    # -------------------------------------------------------------------
    # Cenário de Falha — IDOR (funcionário não vinculado)
    # -------------------------------------------------------------------

    def test_upload_fotos_funcionario_nao_vinculado_403(self):
        """Outro funcionário tenta upload em atendimento alheio → 403."""
        self.client.force_authenticate(user=self.outro_funcionario)

        foto = _criar_imagem_fake()

        response = self.client.post(
            self.url,
            data={'momento': 'ANTES', 'arquivos': [foto]},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # -------------------------------------------------------------------
    # Cenário de Falha — Ciclo de Vida
    # -------------------------------------------------------------------

    def test_upload_fotos_atendimento_cancelado_400(self):
        """Upload em atendimento CANCELADO → 400."""
        self.atendimento.status = 'cancelado'
        self.atendimento.save()

        self.client.force_authenticate(user=self.funcionario)

        foto = _criar_imagem_fake()

        response = self.client.post(
            self.url,
            data={'momento': 'ANTES', 'arquivos': [foto]},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # -------------------------------------------------------------------
    # Cenário de Falha — Não autenticado
    # -------------------------------------------------------------------

    def test_upload_fotos_usuario_nao_autenticado_401(self):
        """Requisição sem token → 401."""
        foto = _criar_imagem_fake()

        response = self.client.post(
            self.url,
            data={'momento': 'ANTES', 'arquivos': [foto]},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # -------------------------------------------------------------------
    # Resposta — URL absoluta
    # -------------------------------------------------------------------

    def test_resposta_contem_url_absoluta(self):
        """O campo 'arquivo' na resposta deve conter uma URL absoluta (http://...)."""
        self.client.force_authenticate(user=self.funcionario)

        foto = _criar_imagem_fake()

        response = self.client.post(
            self.url,
            data={'momento': 'ANTES', 'arquivos': [foto]},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data[0]['arquivo'].startswith('http'))
