"""
Testes de integração para a API REST.
RF-04: Iniciar atendimento (concorrência, fila, restrições de negócio).
RF-05: Upload de fotos antes do atendimento.
RF-06: Upload de fotos após o atendimento.
Testa o contrato HTTP: status codes, permissões, formato de resposta.
"""
import tempfile
from datetime import datetime
from io import BytesIO
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


class TestHistoricoAtendimentosAPI(TestCase):
    """Testes de integraÃ§Ã£o para GET /api/atendimentos/historico/."""

    def setUp(self):
        self.funcionario = UserFactory()
        self.outro_funcionario = UserFactory()
        self.client = APIClient()
        self.url = reverse('atendimentos-historico')

    def test_historico_sem_status_retorna_proprios_de_multiplos_status(self):
        """Deve retornar apenas atendimentos finalizados do usuÃ¡rio logado dentro do perÃ­odo."""
        AtendimentoFactory(
            funcionario=self.funcionario,
            status='finalizado',
            data_hora=timezone.make_aware(datetime(2026, 3, 10, 8, 0)),
        )
        AtendimentoFactory(
            funcionario=self.funcionario,
            status='em_andamento',
            data_hora=timezone.make_aware(datetime(2026, 3, 12, 17, 30)),
        )
        AtendimentoFactory(
            funcionario=self.funcionario,
            status='agendado',
            data_hora=timezone.make_aware(datetime(2026, 3, 11, 10, 0)),
        )
        AtendimentoFactory(
            funcionario=self.outro_funcionario,
            status='finalizado',
            data_hora=timezone.make_aware(datetime(2026, 3, 11, 9, 0)),
        )
        AtendimentoFactory(
            funcionario=self.funcionario,
            status='finalizado',
            data_hora=timezone.make_aware(datetime(2026, 3, 13, 9, 0)),
        )

        self.client.force_authenticate(user=self.funcionario)
        response = self.client.get(self.url, {'data_inicial': '2026-03-10', 'data_final': '2026-03-12'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
        self.assertEqual({item['status'] for item in response.data}, {'finalizado', 'em_andamento', 'agendado'})
        self.assertEqual(
            [item['data_hora'][:10] for item in response.data],
            ['2026-03-12', '2026-03-11', '2026-03-10'],
        )

    def test_historico_filtra_por_status_quando_informado(self):
        """Quando o status é informado, o endpoint deve devolver somente o status solicitado."""
        AtendimentoFactory(
            funcionario=self.funcionario,
            status='finalizado',
            data_hora=timezone.make_aware(datetime(2026, 3, 10, 8, 0)),
        )
        AtendimentoFactory(
            funcionario=self.funcionario,
            status='agendado',
            data_hora=timezone.make_aware(datetime(2026, 3, 11, 10, 0)),
        )
        AtendimentoFactory(
            funcionario=self.funcionario,
            status='em_andamento',
            data_hora=timezone.make_aware(datetime(2026, 3, 12, 17, 30)),
        )

        self.client.force_authenticate(user=self.funcionario)
        response = self.client.get(
            self.url,
            {'data_inicial': '2026-03-10', 'data_final': '2026-03-12', 'status': 'finalizado'},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['status'], 'finalizado')

    def test_historico_periodo_invalido_retorna_400(self):
        """Data inicial maior que data final deve retornar 400."""
        self.client.force_authenticate(user=self.funcionario)

        response = self.client.get(self.url, {'data_inicial': '2026-04-20', 'data_final': '2026-04-10'})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'A data inicial nÃ£o pode ser maior que a data final.')

    def test_historico_periodo_futuro_retorna_400(self):
        """Histórico não deve aceitar consulta com datas futuras."""
        self.client.force_authenticate(user=self.funcionario)

        response = self.client.get(self.url, {'data_inicial': '2026-04-02', 'data_final': '2026-04-03'})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'O periodo do historico nao pode incluir datas futuras.')

    def test_historico_sem_parametros_obrigatorios_retorna_400(self):
        """Os parÃ¢metros data_inicial e data_final sÃ£o obrigatÃ³rios."""
        self.client.force_authenticate(user=self.funcionario)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('data_inicial', response.data)
        self.assertIn('data_final', response.data)

    def test_historico_nao_autenticado_retorna_401(self):
        """RequisiÃ§Ã£o sem autenticaÃ§Ã£o deve retornar 401."""
        response = self.client.get(self.url, {'data_inicial': '2026-04-10', 'data_final': '2026-04-12'})

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

    # -------------------------------------------------------------------
    # RF-05/06 — Limite de 5 fotos via API
    # -------------------------------------------------------------------

    def test_upload_excedendo_limite_5_retorna_400(self):
        """Enviar 6 fotos de uma vez → 400."""
        self.client.force_authenticate(user=self.funcionario)

        response = self.client.post(
            self.url,
            data={
                'momento': 'ANTES',
                'arquivos': [criar_imagem_fake_buffer(f'f{i}.jpg') for i in range(6)],
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upload_complementar_excedendo_limite_retorna_400(self):
        """Já existe 4 fotos ANTES; enviar mais 2 → 400 (total seria 6)."""
        self.client.force_authenticate(user=self.funcionario)

        # Envia 4 primeiras
        self.client.post(
            self.url,
            data={
                'momento': 'ANTES',
                'arquivos': [criar_imagem_fake_buffer(f'f{i}.jpg') for i in range(4)],
            },
            format='multipart',
        )

        # Tenta enviar mais 2 (total = 6)
        response = self.client.post(
            self.url,
            data={
                'momento': 'ANTES',
                'arquivos': [criar_imagem_fake_buffer('f5.jpg'), criar_imagem_fake_buffer('f6.jpg')],
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # -------------------------------------------------------------------
    # RF-06 — Upload de fotos DEPOIS
    # -------------------------------------------------------------------

    def test_upload_fotos_depois_funciona_em_andamento(self):
        """Upload de fotos DEPOIS em atendimento EM_ANDAMENTO → 201."""
        self.atendimento.status = 'em_andamento'
        self.atendimento.save()

        self.client.force_authenticate(user=self.funcionario)

        response = self.client.post(
            self.url,
            data={
                'momento': 'DEPOIS',
                'arquivos': [criar_imagem_fake_buffer('depois1.jpg')],
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data[0]['momento'], 'DEPOIS')

    # -------------------------------------------------------------------
    # Segurança — Extensão de arquivo inválida
    # -------------------------------------------------------------------

    def test_upload_arquivo_nao_imagem_retorna_400(self):
        """Enviar arquivo .txt disfarçado → 400."""
        self.client.force_authenticate(user=self.funcionario)

        arquivo_txt = BytesIO(b'isto nao e uma imagem')
        arquivo_txt.name = 'malicioso.txt'

        response = self.client.post(
            self.url,
            data={'momento': 'ANTES', 'arquivos': [arquivo_txt]},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class TestFinalizarAtendimentoAPI(TestCase):
    """Testes para o endpoint PATCH /api/atendimentos/{id}/finalizar/"""

    def setUp(self):
        self.funcionario = UserFactory()
        self.outro_funcionario = UserFactory()
        self.atendimento = AtendimentoFactory(funcionario=self.funcionario, status='em_andamento')
        self.client = APIClient()
        self.url = reverse('atendimento-finalizar', kwargs={'pk': self.atendimento.pk})
        
        # Cria foto de ANTES por padrao para simular cenario real inicial
        from atendimentos.models import MidiaAtendimento
        MidiaAtendimento.objects.create(atendimento=self.atendimento, arquivo='fake.jpg', momento='ANTES')

    def test_finalizar_atendimento_sucesso(self):
        """Finalizar atendimento com sucesso -> 200 OK (com foto DEPOIS)"""
        self.client.force_authenticate(user=self.funcionario)
        from atendimentos.models import MidiaAtendimento
        MidiaAtendimento.objects.create(atendimento=self.atendimento, arquivo='fake.jpg', momento='DEPOIS')

        response = self.client.patch(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'finalizado')

    def test_finalizar_sem_foto_depois_falha(self):
        """Tentativa de finalizar sem foto DEPOIS -> 400 Bad Request"""
        self.client.force_authenticate(user=self.funcionario)
        
        response = self.client.patch(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'Não é possível finalizar sem enviar as fotos do DEPOIS.')

    def test_finalizar_status_invalido_falha(self):
        """Atendimento que não está em_andamento não pode ser finalizado -> 400 Bad request"""
        self.atendimento.status = 'agendado'
        self.atendimento.save()
        self.client.force_authenticate(user=self.funcionario)
        
        # mesmo com foto depois
        from atendimentos.models import MidiaAtendimento
        MidiaAtendimento.objects.create(atendimento=self.atendimento, arquivo='fake.jpg', momento='DEPOIS')

        response = self.client.patch(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'Apenas atendimentos em andamento podem ser finalizados.')

    def test_funcionario_alheio_falha_403(self):
        """Outro funcionario não pode finalizar -> 403 Forbidden"""
        self.client.force_authenticate(user=self.outro_funcionario)
        response = self.client.patch(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
