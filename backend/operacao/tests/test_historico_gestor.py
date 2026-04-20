import pytest
from django.utils import timezone
from rest_framework.test import APIClient
from accounts.models import Gestor
from operacao.models import IncidenteOS
from .factories import UserFactory, OrdemServicoFactory, EstabelecimentoFactory, MidiaOrdemServicoFactory, TagPecaFactory

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def estabelecimento():
    return EstabelecimentoFactory()

@pytest.fixture
def gestor(estabelecimento):
    user = UserFactory()
    Gestor.objects.create(user=user, estabelecimento=estabelecimento)
    return user

@pytest.fixture
def client_gestor(api_client, gestor):
    api_client.force_authenticate(user=gestor)
    return api_client

@pytest.mark.django_db
class TestHistoricoGestor:

    def test_consulta_historico_com_filtros(self, client_gestor, estabelecimento):
        # Arrange
        os1 = OrdemServicoFactory(estabelecimento=estabelecimento, status='FINALIZADO', data_hora=timezone.now())
        os2 = OrdemServicoFactory(estabelecimento=estabelecimento, status='PATIO', data_hora=timezone.now())
        
        # Act
        response = client_gestor.get('/api/ordens-servico/gestor/historico/', {'status': 'FINALIZADO'})
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert 'results' in data # Pagination
        assert len(data['results']) == 1
        assert data['results'][0]['id'] == os1.id

    def test_visualizacao_midias_agrupamento(self, client_gestor, estabelecimento):
        # Arrange
        os = OrdemServicoFactory(estabelecimento=estabelecimento)
        MidiaOrdemServicoFactory(ordem_servico=os, momento='VISTORIA_GERAL')
        MidiaOrdemServicoFactory(ordem_servico=os, momento='AVARIA_PREVIA')
        MidiaOrdemServicoFactory(ordem_servico=os, momento='FINALIZADO')
        
        # Act
        response = client_gestor.get(f'/api/ordens-servico/gestor/historico/{os.id}/fotos/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert 'estado_inicial' in data
        assert 'estado_final' in data
        assert 'estado_meio' in data
        assert len(data['estado_inicial']) == 2
        assert len(data['estado_final']) == 1

    def test_validacao_isolamento_multi_tenant(self, api_client):
        # Arrange
        estab1 = EstabelecimentoFactory()
        estab2 = EstabelecimentoFactory()
        
        gestor1 = UserFactory()
        Gestor.objects.create(user=gestor1, estabelecimento=estab1)
        
        os_estab2 = OrdemServicoFactory(estabelecimento=estab2)
        
        api_client.force_authenticate(user=gestor1)
        
        # Act: Gestor 1 tentando acessar fotos da OS do Gestor 2
        response_fotos = api_client.get(f'/api/ordens-servico/gestor/historico/{os_estab2.id}/fotos/')
        
        # Assert
        assert response_fotos.status_code in [403, 404]

    def test_sanitizacao_cronologica_antivies(self, client_gestor):
        # Act: data_inicio > data_fim
        response = client_gestor.get('/api/ordens-servico/gestor/historico/', {
            'data_inicio': '2026-12-31',
            'data_fim': '2026-01-01'
        })
        
        # Assert
        assert response.status_code == 400

    def test_auditoria_de_dano_estado_meio(self, client_gestor, estabelecimento):
        # Arrange
        os = OrdemServicoFactory(estabelecimento=estabelecimento)
        tag = TagPecaFactory(estabelecimento=estabelecimento)
        
        IncidenteOS.objects.create(
            ordem_servico=os,
            tag_peca=tag,
            descricao='Arranhão profundo',
            foto_url='incidentes/arrada.jpg',
            resolvido=False
        )
        
        # Act
        response = client_gestor.get(f'/api/ordens-servico/gestor/historico/{os.id}/fotos/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert len(data['estado_meio']) == 1
        assert 'incidentes/arrada.jpg' in data['estado_meio'][0]['arquivo_url']
