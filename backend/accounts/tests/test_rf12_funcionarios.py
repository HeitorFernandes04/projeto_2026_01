from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User, Funcionario, CargoChoices
from operacao.models import OrdemServico
from operacao.tests.factories import EstabelecimentoFactory, UserFactory, OrdemServicoFactory, ServicoFactory, VeiculoFactory

class FuncionariosAPITestCase(APITestCase):
    """
    Testes para a RF-12 (Administração de Funcionários)
    Cobre: Criação, Listagem (IDOR), Inativação (Soft Delete) e Hierarquia.
    """

    def setUp(self):
        # Criar dois estabelecimentos para testes de isolamento (Multi-tenant)
        self.estabelecimento_a = EstabelecimentoFactory()
        self.estabelecimento_b = EstabelecimentoFactory()

        # Criar gestores
        # Nota: O setup de Gestor no banco exige o perfil correspondente
        from accounts.models import Gestor
        self.user_gestor_a = UserFactory(username='gestor_a', email='gestor_a@teste.com')
        Gestor.objects.create(user=self.user_gestor_a, estabelecimento=self.estabelecimento_a)
        
        self.user_gestor_b = UserFactory(username='gestor_b', email='gestor_b@teste.com')
        Gestor.objects.create(user=self.user_gestor_b, estabelecimento=self.estabelecimento_b)

        # Criar um funcionário no Estabelecimento A para testes de listagem/inativação
        self.user_func_a = UserFactory(
            username='func_a', 
            estabelecimento=self.estabelecimento_a, 
            cargo=CargoChoices.LAVADOR
        )
        
        self.url = '/api/gestao/funcionarios/'

    def test_gerente_pode_criar_funcionario_com_sucesso(self):
        """Teste 2.3: Gestor cria funcionário vinculado ao seu estabelecimento"""
        self.client.force_authenticate(user=self.user_gestor_a)
        
        payload = {
            'email': 'novo_operador@lavame.com.br',
            'username': 'operador_novo',
            'password': 'senha_segura_123',
            'name': 'João Operador',
            'cargo': CargoChoices.DETALHISTA
        }
        
        response = self.client.post(self.url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verificar se o usuário e o perfil foram criados corretamente
        user_criado = User.objects.get(email='novo_operador@lavame.com.br')
        self.assertEqual(user_criado.perfil_funcionario.estabelecimento, self.estabelecimento_a)
        self.assertEqual(user_criado.perfil_funcionario.cargo, CargoChoices.DETALHISTA)

    def test_prevencao_idor_na_listagem_de_funcionarios(self):
        """Teste 2.4/RNF-01: Gestor não pode ver funcionários de outro estabelecimento"""
        # Criar funcionário no Estabelecimento B
        UserFactory(username='func_b', estabelecimento=self.estabelecimento_b)
        
        self.client.force_authenticate(user=self.user_gestor_a)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Deve retornar apenas o funcionário do estabelecimento A
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['username'], 'func_a')

    def test_rejeicao_estabelecimento_id_cruzado_no_cadastro(self):
        """Teste 2.4/CA-04: API deve ignorar estabelecimento_id enviado no payload e usar o do gestor logado"""
        self.client.force_authenticate(user=self.user_gestor_a)
        
        payload = {
            'email': 'atentado_idor@lavame.com.br',
            'username': 'hacker_user',
            'password': 'password123',
            'name': 'Hacker',
            'estabelecimento': self.estabelecimento_b.id  # Tenta se vincular ao B
        }
        
        response = self.client.post(self.url, payload, format='json')
        
        # O backend deve forçar o vínculo com o estabelecimento A do gestor autenticado
        user_criado = User.objects.get(username='hacker_user')
        self.assertEqual(user_criado.perfil_funcionario.estabelecimento, self.estabelecimento_a)

    def test_inativacao_preserva_historico_de_os(self):
        """Teste 2.3/CA-03: Inativar funcionário não corrompe OS passadas"""
        # Criar uma OS executada pelo funcionário A
        servico = ServicoFactory(estabelecimento=self.estabelecimento_a)
        veiculo = VeiculoFactory(estabelecimento=self.estabelecimento_a)
        os = OrdemServicoFactory(
            estabelecimento=self.estabelecimento_a,
            servico=servico,
            veiculo=veiculo,
            funcionario=self.user_func_a,
            status='FINALIZADO'
        )
        
        self.client.force_authenticate(user=self.user_gestor_a)
        
        # Inativar o funcionário
        response = self.client.patch(f'{self.url}{self.user_func_a.id}/', {'is_active': False}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar integridade da OS
        os.refresh_from_db()
        self.user_func_a.refresh_from_db()
        self.assertEqual(os.funcionario, self.user_func_a)
        self.assertFalse(self.user_func_a.is_active)

    def test_prevencao_acesso_por_cargo_hierarquia(self):
        """Teste 2.5: Funcionário de pista não pode acessar API de gestão"""
        self.client.force_authenticate(user=self.user_func_a)
        
        # Tentar listar funcionários
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Tentar criar funcionário
        response = self.client.post(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
