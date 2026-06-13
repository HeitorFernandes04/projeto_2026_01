import pytest
from django.utils import timezone
from datetime import timedelta
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from accounts.models import Estabelecimento, Funcionario, User
from operacao.models import OrdemServico, Veiculo, Servico
from operacao.services import OrdemServicoService

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def test_setup(db):
    user_func = User.objects.create(username='func1', email='f1@test.com')
    estabelecimento = Estabelecimento.objects.create(nome_fantasia='Lava-Me Matriz')
    funcionario = Funcionario.objects.create(user=user_func, estabelecimento=estabelecimento)

    veiculo = Veiculo.objects.create(
        estabelecimento=estabelecimento,
        placa='XYZ9876',
        celular_dono='11999999999'
    )
    servico = Servico.objects.create(
        estabelecimento=estabelecimento,
        nome='Lavagem Completa',
        duracao_estimada_minutos=30,
        preco=50.0
    )

    os = OrdemServico.objects.create(
        estabelecimento=estabelecimento,
        veiculo=veiculo,
        servico=servico,
        funcionario=user_func,
        status='EM_EXECUCAO',
        horario_lavagem=timezone.now() - timedelta(seconds=120),
        tempo_acumulado_segundos=10
    )

    return {
        'user_func': user_func,
        'funcionario': funcionario,
        'estabelecimento': estabelecimento,
        'veiculo': veiculo,
        'servico': servico,
        'os': os
    }

@pytest.mark.django_db
class TestTimerPauseLogic:

    def test_pausar_ordem_servico_sucesso(self, test_setup):
        os = test_setup['os']
        # Deve estar em execução e não pausada inicialmente
        assert os.status == 'EM_EXECUCAO'
        assert not os.is_pausado

        # Pausar
        os_pausada = OrdemServicoService.pausar_ordem_servico(os.id)
        assert os_pausada.is_pausado
        # tempo acumulado deve ser original (10) + aproximadamente 120s decorridos
        assert os_pausada.tempo_acumulado_segundos >= 130

    def test_retomar_ordem_servico_sucesso(self, test_setup):
        os = test_setup['os']
        # Pausa primeiro
        OrdemServicoService.pausar_ordem_servico(os.id)

        # Retoma
        os_retomada = OrdemServicoService.retomar_ordem_servico(os.id)
        assert not os_retomada.is_pausado
        # horario_lavagem deve ter sido resetado para agora (ou muito próximo)
        assert (timezone.now() - os_retomada.horario_lavagem).total_seconds() < 2

    def test_avancar_etapa_com_os_pausada_erro(self, test_setup):
        os = test_setup['os']
        # Pausa a OS
        OrdemServicoService.pausar_ordem_servico(os.id)

        # Tenta avançar para LIBERACAO
        from django.core.exceptions import ValidationError
        with pytest.raises(ValidationError):
            OrdemServicoService.avancar_etapa(os.id, {}, funcionario=test_setup['user_func'])

    def test_api_pausar_e_retomar(self, api_client, test_setup):
        os = test_setup['os']
        api_client.force_authenticate(user=test_setup['user_func'])

        # Chamar endpoint pausar
        url_pausar = reverse('os-pausar', kwargs={'pk': os.id})
        response = api_client.patch(url_pausar, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_pausado'] is True

        # Chamar endpoint retomar
        url_retomar = reverse('os-retomar', kwargs={'pk': os.id})
        response = api_client.patch(url_retomar, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_pausado'] is False
