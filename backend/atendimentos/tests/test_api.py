"""
Testes de integração para a API REST.
RF-04: Iniciar atendimento (concorrência, fila, restrições de negócio).
RF-05: Upload de fotos antes do atendimento.
Testa o contrato HTTP: status codes, permissões, formato de resposta.
"""
import tempfile
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from atendimentos.tests.factories import (
    AtendimentoFactory,
    UserFactory,
    criar_imagem_fake_buffer,
)

TEMP_MEDIA = tempfile.mkdtemp()


class TestIniciarAtendimentoAPI(TestCase):
    """Testes de integração para PATCH /api/atendimentos/{id}/iniciar/ — RF-04."""

    def setUp(self):
        self.funcionario = UserFactory()
        self.outro_funcionario = UserFactory()
        self.client = APIClient()

    # -------------------------------------------------------------------
    # Cenário de Sucesso
    # -------------------------------------------------------------------

    def test_iniciar_atendimento_livre_retorna_200(self):
        """Funcionário inicia atendimento agendado sem dono → 200 e funcionario atribuído."""
        atendimento = AtendimentoFactory(funcionario=None, status='agendado')
        self.client.force_authenticate(user=self.funcionario)

        url = reverse('atendimento-iniciar', kwargs={'pk': atendimento.pk})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        atendimento.refresh_from_db()
        self.assertEqual(atendimento.funcionario, self.funcionario)
        self.assertEqual(atendimento.status, 'em_andamento')

    # -------------------------------------------------------------------
    # Trava: Múltiplos atendimentos simultâneos
    # -------------------------------------------------------------------

    def test_funcionario_ja_em_andamento_retorna_409(self):
        """Funcionário com atendimento em_andamento tenta iniciar outro → 409."""
        AtendimentoFactory(funcionario=self.funcionario, status='em_andamento')
        novo_atendimento = AtendimentoFactory(funcionario=None, status='agendado')

        self.client.force_authenticate(user=self.funcionario)
        url = reverse('atendimento-iniciar', kwargs={'pk': novo_atendimento.pk})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    # -------------------------------------------------------------------
    # Concorrência: Race condition na fila
    # -------------------------------------------------------------------

    def test_atendimento_pre_atribuido_a_outro_retorna_403(self):
        """Atendimento já atribuído a outro funcionário desde o início → permission bloqueia com 403."""
        atendimento = AtendimentoFactory(
            funcionario=self.outro_funcionario,
            status='agendado',
        )

        self.client.force_authenticate(user=self.funcionario)
        url = reverse('atendimento-iniciar', kwargs={'pk': atendimento.pk})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_race_condition_assumido_no_intervalo_retorna_409(self):
        """
        Race condition: atendimento estava livre quando a permissão foi checada
        (funcionario=None), mas outro funcionário o assumiu antes do refresh_from_db → 409.
        """
        from atendimentos.models import Atendimento as AtendimentoModel

        atendimento = AtendimentoFactory(funcionario=None, status='agendado')
        outro = self.outro_funcionario

        def simular_claim_concorrente(obj, **kwargs):
            """Faz o refresh_from_db parecer que outro usuário acabou de assumir o atendimento."""
            obj.funcionario = outro

        self.client.force_authenticate(user=self.funcionario)
        url = reverse('atendimento-iniciar', kwargs={'pk': atendimento.pk})

        with patch.object(AtendimentoModel, 'refresh_from_db', simular_claim_concorrente):
            response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    # -------------------------------------------------------------------
    # Máquina de estados
    # -------------------------------------------------------------------

    def test_iniciar_atendimento_nao_agendado_retorna_409(self):
        """Tentar iniciar atendimento com status != agendado → 409."""
        atendimento = AtendimentoFactory(
            funcionario=self.funcionario,
            status='em_andamento',
        )

        self.client.force_authenticate(user=self.funcionario)
        url = reverse('atendimento-iniciar', kwargs={'pk': atendimento.pk})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)


class TestAtendimentosHojeAPI(TestCase):
    """Testes de integração para GET /api/atendimentos/hoje/ — RF-03/04 (task queue)."""

    def setUp(self):
        self.funcionario = UserFactory()
        self.outro_funcionario = UserFactory()
        self.client = APIClient()
        self.url = reverse('atendimentos-hoje')

    def _atendimento_hoje(self, **kwargs):
        return AtendimentoFactory(data_hora=timezone.now(), **kwargs)

    # -------------------------------------------------------------------
    # Visibilidade da fila
    # -------------------------------------------------------------------

    def test_listagem_exibe_apenas_proprios_e_sem_dono(self):
        """Funcionário vê somente seus atendimentos e os sem dono; nunca os de terceiros."""
        atendimento_proprio = self._atendimento_hoje(funcionario=self.funcionario)
        atendimento_livre = self._atendimento_hoje(funcionario=None)
        self._atendimento_hoje(funcionario=self.outro_funcionario)  # não deve aparecer

        self.client.force_authenticate(user=self.funcionario)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids_retornados = {item['id'] for item in response.data}
        self.assertIn(atendimento_proprio.pk, ids_retornados)
        self.assertIn(atendimento_livre.pk, ids_retornados)
        self.assertEqual(len(ids_retornados), 2)

    def test_listagem_nao_autenticado_retorna_401(self):
        """Requisição sem token → 401."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


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
