import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal

from operacao.tests.factories import (
    GestorFactory,
    EstabelecimentoFactory,
    ServicoFactory,
    OrdemServicoFactory,
    VeiculoFactory,
    UserFactory,
)

def _auth(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client

@pytest.mark.django_db
class TestFinanceiroResumo:
    url = '/api/gestao/financeiro/resumo/'

    def test_totalizacao_correta_rf32_1_e_test_1(self):
        """
        Teste 1: Criar no banco de dados de teste 2 OS finalizadas de R$ 50,00 
        e 1 OS em andamento de R$ 30,00.
        Esperado: O endpoint deve retornar total_faturado: 100.00 (ignorando a OS não finalizada).
        """
        gestor = GestorFactory()
        est = gestor.estabelecimento
        
        servico_50 = ServicoFactory(estabelecimento=est, preco=Decimal('50.00'))
        servico_30 = ServicoFactory(estabelecimento=est, preco=Decimal('30.00'))
        
        veiculo = VeiculoFactory(estabelecimento=est)
        
        # 2 OS finalizadas
        os1 = OrdemServicoFactory(
            estabelecimento=est,
            servico=servico_50,
            veiculo=veiculo,
            status='FINALIZADO',
            horario_finalizacao=timezone.now()
        )
        os2 = OrdemServicoFactory(
            estabelecimento=est,
            servico=servico_50,
            veiculo=veiculo,
            status='FINALIZADO',
            horario_finalizacao=timezone.now()
        )
        # 1 OS em andamento
        OrdemServicoFactory(
            estabelecimento=est,
            servico=servico_30,
            veiculo=veiculo,
            status='PATIO'
        )

        client = _auth(gestor.user)
        response = client.get(self.url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Verifica total faturado
        assert float(data['total_faturado']) == 100.00
        assert data['estabelecimento_nome'] == est.nome_fantasia
        
        # Verifica se retornou apenas as 2 concluídas nas transações
        assert len(data['transacoes']) == 2
        
        # Verifica se os campos necessários estão presentes na listagem
        transacao_ids = [t['id'] for t in data['transacoes']]
        assert os1.id in transacao_ids
        assert os2.id in transacao_ids
        
        # Valida chaves da transação
        t0 = data['transacoes'][0]
        assert 'id' in t0
        assert 'horario_finalizacao' in t0
        assert 'veiculo' in t0
        assert 'servico' in t0
        assert 'valor_cobrado' in t0

    def test_isolamento_tenant_gestores(self):
        """
        Garante que um gestor do estabelecimento A não veja faturamento 
        ou transações do estabelecimento B (Multi-Tenant).
        """
        gestor_a = GestorFactory()
        gestor_b = GestorFactory()
        
        servico_a = ServicoFactory(estabelecimento=gestor_a.estabelecimento, preco=Decimal('80.00'))
        servico_b = ServicoFactory(estabelecimento=gestor_b.estabelecimento, preco=Decimal('150.00'))
        
        # OS no estabelecimento A
        OrdemServicoFactory(
            estabelecimento=gestor_a.estabelecimento,
            servico=servico_a,
            status='FINALIZADO',
            horario_finalizacao=timezone.now()
        )
        
        # OS no estabelecimento B
        OrdemServicoFactory(
            estabelecimento=gestor_b.estabelecimento,
            servico=servico_b,
            status='FINALIZADO',
            horario_finalizacao=timezone.now()
        )

        # Gestor A consulta
        client_a = _auth(gestor_a.user)
        res_a = client_a.get(self.url)
        assert res_a.status_code == status.HTTP_200_OK
        data_a = res_a.json()
        assert float(data_a['total_faturado']) == 80.00
        assert len(data_a['transacoes']) == 1

    def test_bloqueio_permissao_funcionario(self):
        """
        Garante que funcionários (ou outros perfis) não consigam acessar
        o resumo financeiro (RNF-01).
        """
        est = EstabelecimentoFactory()
        funcionario = UserFactory(estabelecimento=est)
        client = _auth(funcionario)
        response = client.get(self.url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_filtro_periodo_data(self):
        """
        Garante que o faturamento e as transações sejam filtrados corretamente
        pelas datas de início e fim.
        """
        gestor = GestorFactory()
        est = gestor.estabelecimento
        servico = ServicoFactory(estabelecimento=est, preco=Decimal('50.00'))
        
        hoje = timezone.localtime()
        ontem = hoje - timedelta(days=1)
        anteontem = hoje - timedelta(days=2)
        
        # OS ontem
        OrdemServicoFactory(
            estabelecimento=est,
            servico=servico,
            status='FINALIZADO',
            horario_finalizacao=ontem
        )
        
        # OS anteontem
        OrdemServicoFactory(
            estabelecimento=est,
            servico=servico,
            status='FINALIZADO',
            horario_finalizacao=anteontem
        )

        client = _auth(gestor.user)
        
        # Filtra apenas por ontem
        params = {
            'data_inicio': ontem.date().isoformat(),
            'data_fim': ontem.date().isoformat()
        }
        response = client.get(self.url, params)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert float(data['total_faturado']) == 50.00
        assert len(data['transacoes']) == 1
