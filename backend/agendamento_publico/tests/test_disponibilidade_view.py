import pytest
import datetime
from django.utils import timezone
from rest_framework.test import APIClient
from accounts.models import Estabelecimento

@pytest.mark.django_db
class TestDisponibilidadeView:

    def setup_method(self):
        self.client = APIClient()
        self.est = Estabelecimento.objects.create(
            nome_fantasia="Lava-Me View Test",
            cnpj="99999999999999",
            horario_abertura=datetime.time(8, 0),
            horario_fechamento=datetime.time(18, 0)
        )
        # O slug é gerado automaticamente no save
        self.slug = self.est.slug
        
        from core.models import Servico
        self.servico = Servico.objects.create(
            nome="Ducha",
            preco=30.00,
            duracao_estimada_minutos=30,
            estabelecimento=self.est
        )

    def test_view_retorna_200_com_horarios(self):
        data_futura = (timezone.localdate() + datetime.timedelta(days=2)).strftime("%Y-%m-%d")
        url = f"/api/publico/agendamento/disponibilidade/?slug={self.slug}&servicoId={self.servico.id}&data={data_futura}"
        
        response = self.client.get(url)
        
        assert response.status_code == 200
        assert isinstance(response.data, list)
        assert len(response.data) > 0
        assert "inicio" in response.data[0]

    def test_view_retorna_400_se_faltar_parametro(self):
        url = f"/api/publico/agendamento/disponibilidade/?slug={self.slug}"
        response = self.client.get(url)
        assert response.status_code == 400
        assert "Parâmetros 'slug', 'servicoId' e 'data' são obrigatórios" in str(response.data)

    def test_view_retorna_404_se_slug_invalido(self):
        data_futura = (timezone.localdate() + datetime.timedelta(days=2)).strftime("%Y-%m-%d")
        url = f"/api/publico/agendamento/disponibilidade/?slug=nao-existe&servicoId={self.servico.id}&data={data_futura}"
        response = self.client.get(url)
        assert response.status_code == 404
