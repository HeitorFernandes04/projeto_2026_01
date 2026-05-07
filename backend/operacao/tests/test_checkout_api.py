import pytest
from django.urls import reverse
from django.utils import timezone
import datetime
from core.models import Servico, Veiculo
from operacao.models import OrdemServico
from operacao.services import OrdemServicoService
from rest_framework.test import APIClient

@pytest.mark.django_db
class TestCheckoutPublicoAPI:
    def setup_method(self):
        self.client = APIClient()
        from accounts.models import Estabelecimento
        self.est = Estabelecimento.objects.create(nome_fantasia="Lava-Me B2C", slug="lava-me-b2c", cnpj="11222333000199", is_active=True)
        self.servico = Servico.objects.create(nome="Lavagem Completa", preco=80.00, duracao_estimada_minutos=60, estabelecimento=self.est)

    def test_9_lock_pessimista_conflito_concorrente(self):
        """Valida select_for_update() impede agendamentos simultâneos no mesmo slot."""
        # Horário futuro dentro do expediente
        amanha = timezone.now() + timezone.timedelta(days=1)
        horario_conflito = amanha.replace(hour=10, minute=0, second=0, microsecond=0)
        
        # Dados idênticos para ambas as requisições
        dados_checkout = {
            'slug': self.est.slug,
            'servico_id': self.servico.id,
            'placa': 'CONC123',
            'modelo': 'Fusca',
            'cor': 'Azul',
            'nome_cliente': 'Cliente Teste',
            'whatsapp': '11999990000',
            'data_hora': horario_conflito
        }
        
        # Primeira tentativa - deve criar com sucesso
        os1 = OrdemServicoService.finalizar_checkout_publico(dados_checkout)
        assert os1 is not None
        assert os1.veiculo.placa == 'CONC123'
        
        # Segunda tentativa com mesmo horário - deve falhar com conflito
        from django.core.exceptions import ValidationError
        with pytest.raises(ValidationError) as exc_info:
            OrdemServicoService.finalizar_checkout_publico(dados_checkout)
        
        # Verifica se o erro é de conflito
        assert 'Conflito com OS' in str(exc_info.value)
