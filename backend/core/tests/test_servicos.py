import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from core.models import Servico
from accounts.models import User, Estabelecimento, Gestor

User = get_user_model()

class TestServicos(TestCase):
    """Testes para RF-11: Gestão de Serviços"""
    
    def setUp(self):
        """Configuração inicial dos testes"""
        self.client = APIClient()
        self.gestor_a = User.objects.create_user(
            username='gestor_a',
            email='gestora@lavame.com.br',
            password='test123',
            is_staff=True
        )
        self.gestor_b = User.objects.create_user(
            username='gestor_b',
            email='gestorb@lavame.com.br', 
            password='test123',
            is_staff=True
        )
        
        self.estabelecimento_a = Estabelecimento.objects.create(
            nome_fantasia='Lava-Me Centro',
            cnpj='12.345.678/0001-90'
        )
        
        self.estabelecimento_b = Estabelecimento.objects.create(
            nome_fantasia='Lava-Me Norte',
            cnpj='12.345.678/0002-91'
        )
        
        # Criar objetos Gestor vinculando usuários aos estabelecimentos
        self.gestor_perfil_a = Gestor.objects.create(
            user=self.gestor_a,
            estabelecimento=self.estabelecimento_a
        )
        
        self.gestor_perfil_b = Gestor.objects.create(
            user=self.gestor_b,
            estabelecimento=self.estabelecimento_b
        )
        
        self.servico_ativo_a = Servico.objects.create(
            nome='Lavagem Completa A',
            preco=80.00,
            duracao_estimada_minutos=45,
            estabelecimento=self.estabelecimento_a,
            is_active=True
        )
        
        self.servico_ativo_b = Servico.objects.create(
            nome='Lavagem Completa B',
            preco=85.00,
            duracao_estimada_minutos=50,
            estabelecimento=self.estabelecimento_b,
            is_active=True
        )
        
        self.servico_inativo = Servico.objects.create(
            nome='Lavagem Expressa',
            preco=35.00,
            duracao_estimada_minutos=20,
            estabelecimento=self.estabelecimento_a,
            is_active=False
        )

    def test_soft_delete_servico(self):
        """Testa Soft Delete: ao deletar, is_active deve ser False e registro deve permanecer"""
        # Soft delete via método customizado
        self.servico_ativo_a.soft_delete()
        
        # Verifica se is_active foi alterado para False
        self.servico_ativo_a.refresh_from_db()
        assert self.servico_ativo_a.is_active is False
        
        # Verifica se o registro ainda existe no banco
        assert Servico.objects.filter(id=self.servico_ativo_a.id).exists()
        
        # Verifica se não aparece no queryset ativo
        assert self.servico_ativo_a not in Servico.objects.filter(is_active=True)

    def test_prevencao_idor_gestor_a_nao_pode_ver_servicos_do_gestor_b(self):
        """Testa Prevenção de IDOR: Gestor A não consegue ver/editar serviços do Gestor B"""
        # Autentica como Gestor A
        self.client.force_authenticate(user=self.gestor_a)
        
        # Tenta acessar serviço do Gestor B (deve falhar)
        url = f'/api/gestao/servicos/{self.servico_ativo_b.id}/'
        response = self.client.get(url)
        
        # Deve retornar 404 (serviço de outro estabelecimento não existe)
        assert response.status_code == 404

    def test_prevencao_idor_gestor_b_nao_pode_ver_servicos_do_gestor_a(self):
        """Testa Prevenção de IDOR: Gestor B não consegue ver/editar serviços do Gestor A"""
        # Autentica como Gestor B
        self.client.force_authenticate(user=self.gestor_b)
        
        # Tenta acessar serviço do Gestor A (deve falhar)
        url = f'/api/gestao/servicos/{self.servico_ativo_a.id}/'
        response = self.client.get(url)
        
        # Deve retornar 404 (serviço de outro estabelecimento não existe)
        assert response.status_code == 404

    def test_obrigatoriedade_duracao_estimada_minutos(self):
        """Testa obrigatoriedade do campo duracao_estimada_minutos"""
        # Autentica como Gestor A
        self.client.force_authenticate(user=self.gestor_a)
        
        # Tenta criar serviço sem duracao_estimada_minutos
        response = self.client.post('/api/gestao/servicos/', {
            'nome': 'Serviço Teste',
            'preco': '50.00',
            'estabelecimento': self.estabelecimento_a.id
            # duracao_estimada_minutos ausente
        })
        
        # Deve retornar erro de validação
        assert response.status_code == 400
        assert 'duracao_estimada_minutos' in response.data

    def test_listar_servicos_apenas_do_estabelecimento_do_usuario(self):
        """Testa se get_queryset filtra por estabelecimento e is_active=True"""
        # Autentica como Gestor A
        self.client.force_authenticate(user=self.gestor_a)
        
        # Lista serviços (deve retornar apenas do estabelecimento do Gestor A)
        response = self.client.get('/api/gestao/servicos/')
        
        assert response.status_code == 200
        servicos_retornados = response.data
        
        # Verifica se retorna apenas serviços ativos do estabelecimento correto
        ids_retornados = [s['id'] for s in servicos_retornados]
        assert self.servico_ativo_a.id in ids_retornados
        assert self.servico_inativo.id not in ids_retornados  # não deve retornar inativos

    def test_criar_servico_com_sucesso(self):
        """Testa criação bem-sucedida de serviço"""
        # Autentica como Gestor A
        self.client.force_authenticate(user=self.gestor_a)
        
        # Cria serviço válido
        response = self.client.post('/api/gestao/servicos/', {
            'nome': 'Polimento Completo',
            'preco': '120.00',
            'duracao_estimada_minutos': 90,
            'estabelecimento': self.estabelecimento_a.id
        })
        
        assert response.status_code == 201
        assert response.data['nome'] == 'Polimento Completo'
        assert response.data['preco'] == '120.00'
        assert response.data['duracao_estimada_minutos'] == 90

    def test_atualizar_servico_proprio(self):
        """Testa se gestor pode atualizar seu próprio serviço"""
        # Autentica como Gestor A
        self.client.force_authenticate(user=self.gestor_a)
        
        # Atualiza serviço próprio
        response = self.client.patch(f'/api/gestao/servicos/{self.servico_ativo_a.id}/', {
            'nome': 'Lavagem Premium',
            'preco': '150.00'
        })
        
        assert response.status_code == 200
        assert response.data['nome'] == 'Lavagem Premium'
        assert response.data['preco'] == '150.00'

    def test_atualizar_servico_alheio(self):
        """Testa se gestor não pode atualizar serviço de outro estabelecimento"""
        # Cria serviço para Gestor B
        servico_b = Servico.objects.create(
            nome='Serviço B',
            preco=60.00,
            duracao_estimada_minutos=40,
            estabelecimento=self.estabelecimento_b,
            is_active=True
        )
        
        # Autentica como Gestor A
        self.client.force_authenticate(user=self.gestor_a)
        
        # Tenta atualizar serviço do Gestor B
        response = self.client.patch(f'/api/gestao/servicos/{servico_b.id}/', {
            'nome': 'Serviço Modificado'
        })
        
        # Deve falhar por proteção de estabelecimento
        assert response.status_code in [403, 404]

    def test_criar_servico_sem_nome(self):
        """Testa criação de serviço sem nome retorna 400"""
        # Autentica como Gestor A
        self.client.force_authenticate(user=self.gestor_a)
        
        # Tenta criar serviço sem nome
        response = self.client.post('/api/gestao/servicos/', {
            'preco': '50.00',
            'duracao_estimada_minutos': 30
        })
        
        # Deve retornar erro de validação
        assert response.status_code == 400

    def test_criar_servico_sem_preco(self):
        """Testa criação de serviço sem preço retorna 400"""
        # Autentica como Gestor A
        self.client.force_authenticate(user=self.gestor_a)
        
        # Tenta criar serviço sem preço
        response = self.client.post('/api/gestao/servicos/', {
            'nome': 'Serviço Teste',
            'duracao_estimada_minutos': 30
        })
        
        # Deve retornar erro de validação
        assert response.status_code == 400

    def test_criar_servico_com_duracao_invalida(self):
        """Testa criação de serviço com duração inválida retorna 400"""
        # Autentica como Gestor A
        self.client.force_authenticate(user=self.gestor_a)
        
        # Tenta criar serviço com duração negativa
        response = self.client.post('/api/gestao/servicos/', {
            'nome': 'Serviço Teste',
            'preco': '50.00',
            'duracao_estimada_minutos': -10
        })
        
        # Deve retornar erro de validação
        assert response.status_code == 400

    def test_duplicidade_nome_mesmo_estabelecimento(self):
        """Testa validação de duplicidade de nome no mesmo estabelecimento"""
        # Autentica como Gestor A
        self.client.force_authenticate(user=self.gestor_a)
        
        # Tenta criar serviço com nome duplicado
        response = self.client.post('/api/gestao/servicos/', {
            'nome': 'Lavagem Completa A',  # Nome duplicado
            'preco': '90.00',
            'duracao_estimada_minutos': 40
        })
        
        # Deve retornar erro de duplicidade
        assert response.status_code == 400

    def test_mesmo_nome_estabelecimentos_diferentes(self):
        """Testa que mesmo nome em estabelecimentos diferentes é permitido"""
        # Autentica como Gestor B
        self.client.force_authenticate(user=self.gestor_b)
        
        # Cria serviço com mesmo nome do estabelecimento A
        response = self.client.post('/api/gestao/servicos/', {
            'nome': 'Lavagem Completa A',  # Mesmo nome do estabelecimento A
            'preco': '95.00',
            'duracao_estimada_minutos': 55
        })
        
        # Deve permitir criação
        assert response.status_code == 201

    def test_soft_delete_via_api(self):
        """Testa soft delete via API endpoint"""
        # Autentica como Gestor A
        self.client.force_authenticate(user=self.gestor_a)
        
        # Realiza soft delete via API
        response = self.client.delete(f'/api/gestao/servicos/{self.servico_ativo_a.id}/')
        
        # Deve retornar 204 (No Content)
        assert response.status_code == 204
        
        # Verifica se is_active foi alterado para False
        self.servico_ativo_a.refresh_from_db()
        assert self.servico_ativo_a.is_active is False
        
        # Verifica se o registro ainda existe no banco
        assert Servico.objects.filter(id=self.servico_ativo_a.id).exists()

    def test_acesso_nao_autenticado(self):
        """Testa que usuários não autenticados não podem acessar"""
        # Tenta acessar sem autenticação
        response = self.client.get('/api/gestao/servicos/')
        
        # Deve retornar 401 (Unauthorized)
        assert response.status_code == 401

    def test_usuario_sem_perfil_gestor(self):
        """Testa que usuário sem perfil gestor é bloqueado"""
        # Cria usuário sem perfil gestor
        usuario_sem_gestor = User.objects.create_user(
            username='sem_gestor',
            email='semgestor@lavame.com.br',
            password='test123'
        )
        
        # Autentica como usuário sem perfil gestor
        self.client.force_authenticate(user=usuario_sem_gestor)
        
        # Tenta acessar serviços
        response = self.client.get('/api/gestao/servicos/')
        
        # Deve retornar 403 (Forbidden)
        assert response.status_code == 403
