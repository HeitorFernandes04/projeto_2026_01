"""
Testes de integração para a API REST — RF-05: Upload de fotos antes do atendimento.
Testa o contrato HTTP: status codes, permissões, formato de resposta.
"""
import tempfile

from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from atendimentos.tests.factories import (
    AtendimentoFactory,
    UserFactory,
    criar_imagem_fake_buffer,
)

TEMP_MEDIA = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=TEMP_MEDIA)
class TestFotoUploadAPI(TestCase):
    """Testes de integração para POST /api/atendimentos/{id}/fotos/"""

    def setUp(self):
        self.funcionario = UserFactory()
        self.outro_funcionario = UserFactory()

        self.atendimento = AtendimentoFactory(
            funcionario=self.funcionario,
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

        response = self.client.post(
            self.url,
            data={
                'momento': 'ANTES',
                'arquivos': [criar_imagem_fake_buffer('f1.jpg'), criar_imagem_fake_buffer('f2.jpg')],
            },
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

        response = self.client.post(
            self.url,
            data={'momento': 'ANTES', 'arquivos': [criar_imagem_fake_buffer()]},
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

        response = self.client.post(
            self.url,
            data={'momento': 'ANTES', 'arquivos': [criar_imagem_fake_buffer()]},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # -------------------------------------------------------------------
    # Cenário de Falha — Não autenticado
    # -------------------------------------------------------------------

    def test_upload_fotos_usuario_nao_autenticado_401(self):
        """Requisição sem token → 401."""
        response = self.client.post(
            self.url,
            data={'momento': 'ANTES', 'arquivos': [criar_imagem_fake_buffer()]},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # -------------------------------------------------------------------
    # Resposta — URL absoluta
    # -------------------------------------------------------------------

    def test_resposta_contem_url_absoluta(self):
        """O campo 'arquivo' na resposta deve conter uma URL absoluta (http://...)."""
        self.client.force_authenticate(user=self.funcionario)

        response = self.client.post(
            self.url,
            data={'momento': 'ANTES', 'arquivos': [criar_imagem_fake_buffer()]},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data[0]['arquivo'].startswith('http'))
