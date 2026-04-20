from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import Estabelecimento
from core.models import Servico
from accounts.models import Gestor

User = get_user_model()


class ServicoAPITestCase(TestCase):
    """Testes unitários para API de Serviços (RF-11 e Axioma 14)"""
    
    # core/tests/test_servicos.py

    def setUp(self):
        """Configuração inicial com vínculo obrigatório de Gestor"""
        self.client = APIClient()
        
        # 1. Criar estabelecimentos com CNPJ limpo para evitar erro 400
        self.estabelecimento_a = Estabelecimento.objects.create(
            nome_fantasia='Lava-Me Centro',
            cnpj='12345678000190'
        )
        self.estabelecimento_b = Estabelecimento.objects.create(
            nome_fantasia='Lava-Me Norte',
            cnpj='12345678000291'
        )

        # 2. Criar utilizadores
        self.gestor_a = User.objects.create_user(
            username='gestor_a', email='gestora@lavame.com.br', password='test123'
        )
        self.gestor_b = User.objects.create_user(
            username='gestor_b', email='gestorb@lavame.com.br', password='test123'
        )
        
        # 3. CRIAR VÍNCULO DE PERFIL (Resolve o Forbidden 403)
        # A View em core/views.py exige este vínculo para identificar o estabelecimento
        Gestor.objects.create(user=self.gestor_a, estabelecimento=self.estabelecimento_a)
        Gestor.objects.create(user=self.gestor_b, estabelecimento=self.estabelecimento_b)
        
        # 4. Criar dados base para os testes
        self.servico_a = Servico.objects.create(
            nome='Lavação Simples',
            preco=80.00,
            duracao_estimada_minutos=45,
            estabelecimento=self.estabelecimento_a,
            is_active=True
        )
        self.servico_b = Servico.objects.create(
            nome='Lavação Premium',
            preco=49.90,
            duracao_estimada_minutos=50,
            estabelecimento=self.estabelecimento_b,
            is_active=True
        )
        

    def test_criar_servico_com_campos_obrigatorios(self):
        """Testa criação de serviço com campos obrigatórios (RF-11)"""
        self.client.force_authenticate(user=self.gestor_a)
        
        dados_servico = {
            'nome': 'Polimento Completo',
            'preco': '89.90',
            'duracao_estimada_minutos': 60
        }
        
        response = self.client.post('/api/gestao/servicos/', dados_servico, format='json')
        
        # Validações
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['nome'], 'Polimento Completo')
        self.assertEqual(response.data['preco'], '89.90')
        self.assertEqual(response.data['duracao_estimada_minutos'], 60)
        self.assertTrue(response.data['is_active'])
        
        # Verificar se foi salvo no banco
        servico_criado = Servico.objects.get(id=response.data['id'])
        self.assertEqual(servico_criado.estabelecimento, self.estabelecimento_a)

    def test_criar_servico_sem_campos_obrigatorios(self):
        """Testa criação de serviço sem campos obrigatórios retorna 400"""
        self.client.force_authenticate(user=self.gestor_a)
        
        # Teste sem nome
        dados_servico = {
            'preco': '29.90',
            'duracao_estimada_minutos': 30
        }
        
        response = self.client.post('/api/gestao/servicos/', dados_servico, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Teste sem preço
        dados_servico = {
            'nome': 'Lavação Simples',
            'duracao_estimada_minutos': 30
        }
        
        response = self.client.post('/api/gestao/servicos/', dados_servico, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Teste sem duração
        dados_servico = {
            'nome': 'Lavação Simples',
            'preco': '29.90'
        }
        
        response = self.client.post('/api/gestao/servicos/', dados_servico, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_isolamento_multi_tenant_listar(self):
        """Testa RNF-01: Gestor A só pode ver serviços do próprio estabelecimento"""
        self.client.force_authenticate(user=self.gestor_a)
        
        response = self.client.get('/api/gestao/servicos/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Deve retornar apenas o serviço do gestor A
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['nome'], 'Lavação Simples')
        self.assertEqual(response.data[0]['id'], self.servico_a.id)
        
        # Não deve retornar o serviço do gestor B
        servicos_ids = [servico['id'] for servico in response.data]
        self.assertNotIn(self.servico_b.id, servicos_ids)

    def test_isolamento_multi_tenant_deletar(self):
        """Testa RNF-01: Gestor A não pode deletar serviços do Gestor B"""
        self.client.force_authenticate(user=self.gestor_a)
        
        # Tentar deletar serviço do gestor B
        response = self.client.delete(f'/api/gestao/servicos/{self.servico_b.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Verificar que o serviço B ainda está ativo
        self.servico_b.refresh_from_db()
        self.assertTrue(self.servico_b.is_active)

    def test_soft_delete_servico_proprio(self):
        """Testa soft delete: is_active=False e registro permanece (CA-02)"""
        self.client.force_authenticate(user=self.gestor_a)
        
        response = self.client.delete(f'/api/gestao/servicos/{self.servico_a.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verificar soft delete
        self.servico_a.refresh_from_db()
        self.assertFalse(self.servico_a.is_active)
        
        # Verificar que o registro ainda existe no banco
        self.assertTrue(Servico.objects.filter(id=self.servico_a.id).exists())
        
        # Verificar que não aparece mais na listagem
        response = self.client.get('/api/gestao/servicos/')
        self.assertEqual(len(response.data), 0)

    def test_atualizar_servico_proprio(self):
        """Testa atualização de serviço do próprio estabelecimento"""
        self.client.force_authenticate(user=self.gestor_a)
        
        dados_atualizacao = {
            'nome': 'Lavação Simples Atualizado',
            'preco': '39.90',
            'duracao_estimada_minutos': 35
        }
        
        response = self.client.patch(
            f'/api/gestao/servicos/{self.servico_a.id}/', 
            dados_atualizacao, 
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nome'], 'Lavação Simples Atualizado')
        self.assertEqual(response.data['preco'], '39.90')
        self.assertEqual(response.data['duracao_estimada_minutos'], 35)

    def test_isolamento_multi_tenant_atualizar(self):
        """Testa RNF-01: Gestor A não pode atualizar serviços do Gestor B"""
        self.client.force_authenticate(user=self.gestor_a)
        
        dados_atualizacao = {
            'nome': 'Lavação Premium Modificado',
            'preco': '99.90'
        }
        
        response = self.client.patch(
            f'/api/gestao/servicos/{self.servico_b.id}/', 
            dados_atualizacao, 
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Verificar que o serviço B não foi alterado
        self.servico_b.refresh_from_db()
        self.assertEqual(self.servico_b.nome, 'Lavação Premium')
        self.assertEqual(float(self.servico_b.preco), 49.90)

    def test_acesso_nao_autenticado_bloqueado(self):
        """Testa que usuários não autenticados não podem acessar"""
        response = self.client.get('/api/gestao/servicos/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        response = self.client.post('/api/gestao/servicos/', {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_usuario_sem_estabelecimento_bloqueado(self):
        """Testa que usuário sem estabelecimento é bloqueado"""
        usuario_sem_estabelecimento = User.objects.create_user(
            username='sem_estabelecimento',
            email='sem@lavame.com.br',
            password='test123'
        )
        
        self.client.force_authenticate(user=usuario_sem_estabelecimento)
        
        response = self.client.get('/api/gestao/servicos/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_duplicidade_nome_mesmo_estabelecimento(self):
        """Testa validação de duplicidade de nome no mesmo estabelecimento"""
        self.client.force_authenticate(user=self.gestor_a)
        
        dados_servico = {
            'nome': 'Lavação Simples',  # Nome duplicado
            'preco': '39.90',
            'duracao_estimada_minutos': 25
        }
        
        response = self.client.post('/api/gestao/servicos/', dados_servico, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Verificar se a mensagem de erro está presente no response
        if isinstance(response.data, dict):
            error_msg = response.data.get('detail', str(response.data))
        else:
            error_msg = str(response.data)
        self.assertIn('Já existe um serviço com este nome', error_msg)

    def test_mesmo_nome_estabelecimentos_diferentes(self):
        """Testa que mesmo nome em estabelecimentos diferentes é permitido"""
        self.client.force_authenticate(user=self.gestor_b)
        
        dados_servico = {
            'nome': 'Lavação Simples',  # Mesmo nome do estabelecimento A
            'preco': '35.90',
            'duracao_estimada_minutos': 30
        }
        
        response = self.client.post('/api/gestao/servicos/', dados_servico, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['nome'], 'Lavação Simples')

    def test_editar_servico_proprio(self):
        """Testa edição de serviço do próprio estabelecimento (PATCH)"""
        self.client.force_authenticate(user=self.gestor_a)
        
        dados_atualizacao = {
            'nome': 'Lavação Simples Editado',
            'preco': '39.90',
            'duracao_estimada_minutos': 35
        }
        
        response = self.client.patch(
            f'/api/gestao/servicos/{self.servico_a.id}/', 
            dados_atualizacao, 
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nome'], 'Lavação Simples Editado')
        self.assertEqual(response.data['preco'], '39.90')
        self.assertEqual(response.data['duracao_estimada_minutos'], 35)
        
        # Verificar no banco
        self.servico_a.refresh_from_db()
        self.assertEqual(self.servico_a.nome, 'Lavação Simples Editado')

    def test_editar_servico_isolamento_multi_tenant(self):
        """Testa RNF-01: Gestor A não pode editar serviços do Gestor B"""
        self.client.force_authenticate(user=self.gestor_a)
        
        dados_atualizacao = {
            'nome': 'Lavação Premium Modificado',
            'preco': '99.90'
        }
        
        response = self.client.patch(
            f'/api/gestao/servicos/{self.servico_b.id}/', 
            dados_atualizacao, 
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Verificar que o serviço B não foi alterado
        self.servico_b.refresh_from_db()
        self.assertEqual(self.servico_b.nome, 'Lavação Premium')

    def test_soft_delete_verificacao_is_active(self):
        """Testa soft delete: is_active=False e registro permanece"""
        self.client.force_authenticate(user=self.gestor_a)
        
        # Verificar que serviço está ativo antes
        self.assertTrue(self.servico_a.is_active)
        
        response = self.client.delete(f'/api/gestao/servicos/{self.servico_a.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verificar soft delete
        self.servico_a.refresh_from_db()
        self.assertFalse(self.servico_a.is_active)
        
        # Verificar que o registro ainda existe no banco
        self.assertTrue(Servico.objects.filter(id=self.servico_a.id).exists())
        
        # Verificar que não aparece mais na listagem
        response = self.client.get('/api/gestao/servicos/')
        self.assertEqual(len(response.data), 0)

    def test_soft_delete_isolamento_multi_tenant(self):
        """Testa RNF-01: Gestor A não pode deletar serviços do Gestor B"""
        self.client.force_authenticate(user=self.gestor_a)
        
        response = self.client.delete(f'/api/gestao/servicos/{self.servico_b.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Verificar que o serviço B ainda está ativo
        self.servico_b.refresh_from_db()
        self.assertTrue(self.servico_b.is_active)