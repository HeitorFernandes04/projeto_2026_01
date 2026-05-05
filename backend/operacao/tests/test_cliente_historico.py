import pytest
from unittest.mock import patch
from django.utils import timezone
from rest_framework.test import APIClient

from operacao.models import OrdemServico
from operacao.tests.factories import (
    ClienteFactory,
    EstabelecimentoFactory,
    OrdemServicoFactory,
    ServicoFactory,
    VeiculoFactory,
)


def _auth(client, user):
    from rest_framework_simplejwt.tokens import RefreshToken
    token = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(token.access_token)}')


@pytest.mark.django_db
class TestClienteHistoricoAPI:
    def setup_method(self):
        self.api = APIClient()
        self.est = EstabelecimentoFactory()
        self.servico = ServicoFactory(estabelecimento=self.est)
        self.cliente = ClienteFactory()
        self.veiculo = VeiculoFactory(estabelecimento=self.est, cliente=self.cliente)

    # --- Acesso e Permissões ---

    def test_acesso_sem_autenticacao_retorna_401(self):
        resp = self.api.get('/api/cliente/historico/')
        assert resp.status_code == 401

    def test_acesso_como_funcionario_retorna_403(self):
        from operacao.tests.factories import UserFactory
        func = UserFactory(estabelecimento=self.est)
        _auth(self.api, func)
        resp = self.api.get('/api/cliente/historico/')
        assert resp.status_code == 403

    def test_cliente_autenticado_acessa_com_sucesso(self):
        _auth(self.api, self.cliente.user)
        resp = self.api.get('/api/cliente/historico/')
        assert resp.status_code == 200
        assert 'ativos' in resp.data
        assert 'historico' in resp.data
        assert 'cliente_nome' in resp.data

    # --- Listagem e Filtragem ---

    def test_cliente_sem_os_retorna_listas_vazias(self):
        _auth(self.api, self.cliente.user)
        resp = self.api.get('/api/cliente/historico/')
        assert resp.status_code == 200
        assert resp.data['ativos'] == []
        assert resp.data['historico'] == []

    def test_historico_retorna_apenas_os_do_cliente_autenticado(self):
        OrdemServicoFactory(
            estabelecimento=self.est,
            veiculo=self.veiculo,
            servico=self.servico,
            status='PATIO',
        )
        _auth(self.api, self.cliente.user)
        resp = self.api.get('/api/cliente/historico/')
        assert resp.status_code == 200
        assert len(resp.data['ativos']) == 1
        # API aplica máscara na placa (TST0004 → TST-0004); comparar sem traço
        placa_retornada = resp.data['ativos'][0]['veiculo_placa'].replace('-', '')
        assert placa_retornada == self.veiculo.placa

    def test_ativos_e_historico_separados_por_status(self):
        status_ativos = ['PATIO', 'VISTORIA_INICIAL', 'EM_EXECUCAO', 'LIBERACAO']
        for s in status_ativos:
            OrdemServicoFactory(
                estabelecimento=self.est,
                veiculo=self.veiculo,
                servico=self.servico,
                status=s,
            )
        OrdemServicoFactory(
            estabelecimento=self.est,
            veiculo=self.veiculo,
            servico=self.servico,
            status='FINALIZADO',
        )
        OrdemServicoFactory(
            estabelecimento=self.est,
            veiculo=self.veiculo,
            servico=self.servico,
            status='CANCELADO',
        )

        _auth(self.api, self.cliente.user)
        resp = self.api.get('/api/cliente/historico/')
        assert resp.status_code == 200
        assert len(resp.data['ativos']) == len(status_ativos)
        assert len(resp.data['historico']) == 2

    def test_serializer_contem_campos_esperados(self):
        OrdemServicoFactory(
            estabelecimento=self.est,
            veiculo=self.veiculo,
            servico=self.servico,
            status='PATIO',
        )
        _auth(self.api, self.cliente.user)
        resp = self.api.get('/api/cliente/historico/')
        os_data = resp.data['ativos'][0]
        for campo in ['id', 'data_hora', 'status', 'status_display', 'etapa_atual',
                      'servico_nome', 'veiculo_placa', 'veiculo_modelo', 'estabelecimento']:
            assert campo in os_data, f"Campo ausente: {campo}"
        assert 'nome_fantasia' in os_data['estabelecimento']
        assert 'slug' in os_data['estabelecimento']

    # --- Prevenção de IDOR ---

    def test_prevencao_idor_entre_dois_clientes(self):
        outro_cliente = ClienteFactory()
        outro_veiculo = VeiculoFactory(estabelecimento=self.est, cliente=outro_cliente)
        OrdemServicoFactory(
            estabelecimento=self.est,
            veiculo=outro_veiculo,
            servico=self.servico,
            status='PATIO',
        )
        OrdemServicoFactory(
            estabelecimento=self.est,
            veiculo=self.veiculo,
            servico=self.servico,
            status='PATIO',
        )

        _auth(self.api, self.cliente.user)
        resp = self.api.get('/api/cliente/historico/')
        assert resp.status_code == 200
        # API aplica máscara (TST0007 → TST-0007); normalizar para comparar
        placas_sem_traco = [p.replace('-', '') for p in
                            [os['veiculo_placa'] for os in resp.data['ativos']]]
        assert self.veiculo.placa in placas_sem_traco
        assert outro_veiculo.placa not in placas_sem_traco

    # --- Auto-link no checkout ---

    def test_checkout_auto_linka_cliente_existente_por_telefone(self):
        from operacao.services import OrdemServicoService

        cliente_com_tel = ClienteFactory(telefone_whatsapp='11988880000')
        est = EstabelecimentoFactory(slug='lava-auto-link', cnpj='99888777000100')
        servico = ServicoFactory(estabelecimento=est, duracao_estimada_minutos=60)

        amanha = timezone.now() + timezone.timedelta(days=2)
        horario = amanha.replace(hour=11, minute=0, second=0, microsecond=0)

        dados = {
            'slug': est.slug,
            'servico_id': servico.id,
            'placa': 'LINK001',
            'modelo': 'Civic',
            'cor': 'Preto',
            'nome_cliente': cliente_com_tel.user.name,
            'whatsapp': '11988880000',
            'data_hora': horario,
        }
        os_criada = OrdemServicoService.finalizar_checkout_publico(dados)

        os_criada.veiculo.refresh_from_db()
        assert os_criada.veiculo.cliente == cliente_com_tel

    def test_checkout_sem_cliente_cadastrado_nao_linka(self):
        from operacao.services import OrdemServicoService

        est = EstabelecimentoFactory(slug='lava-sem-cliente', cnpj='11000222000100')
        servico = ServicoFactory(estabelecimento=est, duracao_estimada_minutos=30)

        amanha = timezone.now() + timezone.timedelta(days=3)
        horario = amanha.replace(hour=14, minute=0, second=0, microsecond=0)

        dados = {
            'slug': est.slug,
            'servico_id': servico.id,
            'placa': 'ANON001',
            'modelo': 'Onix',
            'cor': 'Branco',
            'nome_cliente': 'Anônimo',
            'whatsapp': '11000000000',
            'data_hora': horario,
        }
        os_criada = OrdemServicoService.finalizar_checkout_publico(dados)

        os_criada.veiculo.refresh_from_db()
        assert os_criada.veiculo.cliente is None

    # --- Registro de cliente ---

    def test_registro_cliente_cria_user_e_perfil(self):
        resp = self.api.post('/api/auth/registro-cliente/', {
            'name': 'João Novo',
            'email': 'joao@novo.com',
            'password': 'senha12345',
            'telefone_whatsapp': '11977770000',
        })
        assert resp.status_code == 201
        from accounts.models import Cliente, User
        user = User.objects.get(email='joao@novo.com')
        assert hasattr(user, 'perfil_cliente')
        assert user.perfil_cliente.telefone_whatsapp == '11977770000'

    def test_registro_cliente_retroativamente_linka_veiculos_existentes(self):
        veiculo_orfao = VeiculoFactory(
            estabelecimento=self.est,
            celular_dono='11955550000',
            cliente=None,
        )
        resp = self.api.post('/api/auth/registro-cliente/', {
            'name': 'Maria Retro',
            'email': 'maria@retro.com',
            'password': 'senha12345',
            'telefone_whatsapp': '11955550000',
        })
        assert resp.status_code == 201
        veiculo_orfao.refresh_from_db()
        from accounts.models import Cliente
        cliente_criado = Cliente.objects.get(telefone_whatsapp='11955550000')
        assert veiculo_orfao.cliente == cliente_criado

    # --- historico_meta ---

    def test_historico_meta_presente_na_resposta(self):
        OrdemServicoFactory(
            estabelecimento=self.est, veiculo=self.veiculo, servico=self.servico, status='FINALIZADO'
        )
        _auth(self.api, self.cliente.user)
        resp = self.api.get('/api/cliente/historico/')
        assert resp.status_code == 200
        meta = resp.data['historico_meta']
        assert meta['total'] == 1
        assert meta['limit'] == 50
        assert meta['has_more'] is False

    def test_historico_meta_has_more_verdadeiro_quando_excede_limite(self):
        for _ in range(3):
            OrdemServicoFactory(
                estabelecimento=self.est, veiculo=self.veiculo, servico=self.servico, status='FINALIZADO'
            )
        _auth(self.api, self.cliente.user)
        with patch('operacao.views.HISTORICO_CLIENTE_LIMITE', 2):
            resp = self.api.get('/api/cliente/historico/')
        assert resp.status_code == 200
        meta = resp.data['historico_meta']
        assert meta['total'] == 3
        assert meta['limit'] == 2
        assert meta['has_more'] is True
        assert len(resp.data['historico']) == 2

    def test_cliente_ve_os_de_multiplos_estabelecimentos(self):
        """RF-25: histórico multicentralizado — OSs de qualquer unidade da rede."""
        outro_est = EstabelecimentoFactory()
        outro_servico = ServicoFactory(estabelecimento=outro_est)
        outro_veiculo = VeiculoFactory(estabelecimento=outro_est, cliente=self.cliente)
        OrdemServicoFactory(
            estabelecimento=self.est, veiculo=self.veiculo, servico=self.servico, status='FINALIZADO'
        )
        OrdemServicoFactory(
            estabelecimento=outro_est, veiculo=outro_veiculo, servico=outro_servico, status='FINALIZADO'
        )
        _auth(self.api, self.cliente.user)
        resp = self.api.get('/api/cliente/historico/')
        assert resp.status_code == 200
        assert len(resp.data['historico']) == 2
        slugs = {os['estabelecimento']['slug'] for os in resp.data['historico']}
        assert len(slugs) == 2

    def test_registro_cliente_rejeita_email_duplicado(self):
        self.api.post('/api/auth/registro-cliente/', {
            'name': 'Dup',
            'email': 'dup@test.com',
            'password': 'senha12345',
            'telefone_whatsapp': '11900000001',
        })
        resp = self.api.post('/api/auth/registro-cliente/', {
            'name': 'Dup2',
            'email': 'dup@test.com',
            'password': 'senha12345',
            'telefone_whatsapp': '11900000002',
        })
        assert resp.status_code == 400
