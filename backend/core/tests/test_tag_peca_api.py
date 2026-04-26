from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import Estabelecimento, Funcionario, User
from core.models import TagPeca


class TagPecaListViewTest(TestCase):
    """Testes de multi-tenancy e segurança do endpoint /api/gestao/tags-peca/."""

    URL = '/api/gestao/tags-peca/'

    def setUp(self):
        self.client = APIClient()

        self.estab_a = Estabelecimento.objects.create(
            nome_fantasia='Lava Jato A', cnpj='11111111000101'
        )
        self.estab_b = Estabelecimento.objects.create(
            nome_fantasia='Lava Jato B', cnpj='22222222000102'
        )

        self.user_a = User.objects.create_user(
            username='func_a', email='func_a@test.com', password='pass'
        )
        Funcionario.objects.create(user=self.user_a, estabelecimento=self.estab_a)

        self.user_sem_perfil = User.objects.create_user(
            username='sem_perfil', email='sem@test.com', password='pass'
        )

        TagPeca.objects.create(estabelecimento=self.estab_a, nome='Para-choque', categoria='EXTERNO')
        TagPeca.objects.create(estabelecimento=self.estab_a, nome='Banco', categoria='INTERNO')
        TagPeca.objects.create(estabelecimento=self.estab_b, nome='Capô', categoria='EXTERNO')

    def test_funcionario_ve_apenas_tags_do_seu_estabelecimento(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        nomes = [item['nome'] for item in response.data]
        self.assertIn('Para-choque', nomes)
        self.assertIn('Banco', nomes)
        self.assertNotIn('Capô', nomes)

    def test_funcionario_recebe_duas_tags(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(self.URL)
        self.assertEqual(len(response.data), 2)

    def test_usuario_sem_perfil_recebe_403(self):
        self.client.force_authenticate(user=self.user_sem_perfil)
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_nao_autenticado_recebe_401(self):
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
