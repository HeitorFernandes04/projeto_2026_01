from unittest.mock import patch
import requests
import pytest
from django.core.exceptions import PermissionDenied, ValidationError

from accounts.models import Cliente, User
from agendamento_publico.services import AuthB2CService, WhatsAppOTPService
from operacao.tests.factories import EstabelecimentoFactory, VeiculoFactory


@pytest.mark.django_db
class TestAuthB2CService:
    def test_setup_cria_usuario_b2c_cliente_e_tokens(self):
        estabelecimento = EstabelecimentoFactory()
        veiculo = VeiculoFactory(
            estabelecimento=estabelecimento,
            placa='ABC1234',
            nome_dono='Cliente Teste',
            celular_dono='(11) 99999-9999',
        )

        result = AuthB2CService.setup_cliente(
            telefone='(11) 99999-9999',
            placa='ABC-1234',
            pin='1234',
        )

        user = User.objects.get(username='b2c_11999999999')
        assert user.email == '11999999999@cliente.lava.me'
        assert user.name == 'Cliente Teste'
        assert user.check_password('1234')
        assert user.is_staff is False
        assert user.is_superuser is False
        assert Cliente.objects.get(user=user).telefone_whatsapp == '11999999999'
        veiculo.refresh_from_db()
        assert veiculo.cliente == user.perfil_cliente
        assert set(result.keys()) == {'access', 'refresh', 'usuario'}

    def test_setup_bloqueia_idor_quando_telefone_nao_pertence_a_placa(self):
        estabelecimento = EstabelecimentoFactory()
        VeiculoFactory(
            estabelecimento=estabelecimento,
            placa='AAA1111',
            celular_dono='11911111111',
        )
        VeiculoFactory(
            estabelecimento=estabelecimento,
            placa='BBB2222',
            celular_dono='11922222222',
        )

        with pytest.raises(PermissionDenied):
            AuthB2CService.setup_cliente(
                telefone='11911111111',
                placa='BBB2222',
                pin='1234',
            )

        assert not User.objects.filter(username='b2c_11911111111').exists()

    def test_setup_nao_colide_com_usuario_b2b_de_mesmo_username(self):
        estabelecimento = EstabelecimentoFactory()
        funcionario = User.objects.create_user(
            email='funcionario@lava.me',
            username='11999999999',
            name='Funcionario Existente',
            password='senha-original',
        )
        VeiculoFactory(
            estabelecimento=estabelecimento,
            placa='ABC1234',
            celular_dono='11999999999',
        )

        AuthB2CService.setup_cliente(
            telefone='11999999999',
            placa='ABC1234',
            pin='1234',
        )

        funcionario.refresh_from_db()
        assert funcionario.check_password('senha-original')
        assert User.objects.filter(username='11999999999').exists()
        assert User.objects.filter(username='b2c_11999999999').exists()

    def test_setup_repetido_retorna_conflito_e_preserva_senha(self):
        estabelecimento = EstabelecimentoFactory()
        VeiculoFactory(
            estabelecimento=estabelecimento,
            placa='ABC1234',
            celular_dono='11999999999',
        )
        AuthB2CService.setup_cliente(
            telefone='11999999999',
            placa='ABC1234',
            pin='1234',
        )

        with pytest.raises(ValidationError) as exc_info:
            AuthB2CService.setup_cliente(
                telefone='11999999999',
                placa='ABC1234',
                pin='9999',
            )

        user = User.objects.get(username='b2c_11999999999')
        assert 'ja possui PIN cadastrado' in str(exc_info.value)
        assert user.check_password('1234')
        assert not user.check_password('9999')

    def test_setup_repetido_retorna_conflito_antes_de_validar_placa(self):
        estabelecimento = EstabelecimentoFactory()
        VeiculoFactory(
            estabelecimento=estabelecimento,
            placa='ABC1234',
            celular_dono='11999999999',
        )
        VeiculoFactory(
            estabelecimento=estabelecimento,
            placa='ZZZ9999',
            celular_dono='11888888888',
        )
        AuthB2CService.setup_cliente(
            telefone='11999999999',
            placa='ABC1234',
            pin='1234',
        )

        with pytest.raises(ValidationError) as exc_info:
            AuthB2CService.setup_cliente(
                telefone='11999999999',
                placa='ZZZ9999',
                pin='9999',
            )

        user = User.objects.get(username='b2c_11999999999')
        assert 'ja possui PIN cadastrado' in str(exc_info.value)
        assert user.check_password('1234')
        assert not user.check_password('9999')

    def test_login_cliente_b2c_retorna_tokens(self):
        estabelecimento = EstabelecimentoFactory()
        VeiculoFactory(
            estabelecimento=estabelecimento,
            placa='ABC1234',
            celular_dono='11999999999',
        )
        AuthB2CService.setup_cliente(
            telefone='11999999999',
            placa='ABC1234',
            pin='1234',
        )

        result = AuthB2CService.login_cliente(
            telefone='11999999999',
            pin='1234',
        )

        assert set(result.keys()) == {'access', 'refresh', 'usuario'}

    def test_login_cliente_b2c_rejeita_pin_incorreto(self):
        estabelecimento = EstabelecimentoFactory()
        VeiculoFactory(
            estabelecimento=estabelecimento,
            placa='ABC1234',
            celular_dono='11999999999',
        )
        AuthB2CService.setup_cliente(
            telefone='11999999999',
            placa='ABC1234',
            pin='1234',
        )

        with pytest.raises(PermissionDenied):
            AuthB2CService.login_cliente(
                telefone='11999999999',
                pin='9999',
            )

    def test_solicitar_otp_sucesso(self):
        result = AuthB2CService.solicitar_otp(
            telefone='(11) 99999-9999',
            nome='Teste OTP',
        )
        assert result['detail'] == 'PIN enviado com sucesso.'
        assert 'pin_debug' in result
        
        from django.core.cache import cache
        cached_pin = cache.get('otp_11999999999')
        assert cached_pin == result['pin_debug']

    def test_solicitar_otp_rejeita_usuario_nao_cadastrado_sem_nome(self):
        with pytest.raises(ValidationError) as exc_info:
            AuthB2CService.solicitar_otp(
                telefone='11988887777',
                nome=None,
            )
        assert 'Usuário não cadastrado' in str(exc_info.value)

    def test_solicitar_otp_aceita_usuario_cadastrado_sem_nome(self):
        # Primeiro cria o usuário
        User.objects.create(
            email='11988887777@cliente.lava.me',
            username='b2c_11988887777',
            name='Cliente Cadastrado',
        )
        
        result = AuthB2CService.solicitar_otp(
            telefone='11988887777',
            nome=None,
        )
        assert result['detail'] == 'PIN enviado com sucesso.'


    def test_verificar_otp_sucesso_novo_usuario(self):
        AuthB2CService.solicitar_otp(
            telefone='11999999999',
            nome='Teste OTP',
        )
        from django.core.cache import cache
        pin = cache.get('otp_11999999999')
        
        result = AuthB2CService.verificar_otp(
            telefone='11999999999',
            pin=pin,
        )
        
        assert 'access' in result
        assert 'refresh' in result
        
        user = User.objects.get(username='b2c_11999999999')
        assert user.name == 'Teste OTP'
        assert user.email == '11999999999@cliente.lava.me'

    def test_verificar_otp_pin_invalido(self):
        AuthB2CService.solicitar_otp(
            telefone='11999999999',
            nome='Teste OTP',
        )
        
        with pytest.raises(ValidationError) as exc_info:
            AuthB2CService.verificar_otp(
                telefone='11999999999',
                pin='0000',
            )
        assert 'PIN invalido ou expirado' in str(exc_info.value)


class TestWhatsAppOTPService:
    @patch('agendamento_publico.services.requests.post')
    def test_enviar_mensagem_sucesso_retorna_true(self, mock_post):
        # Configurar mock para sucesso (HTTP 201)
        mock_response = mock_post.return_value
        mock_response.status_code = 201
        
        result = WhatsAppOTPService.enviar_mensagem('11999999999', 'Seu código é 1234')
        
        assert result is True
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert kwargs['json']['number'] == '5511999999999'
        assert kwargs['json']['textMessage']['text'] == 'Seu código é 1234'
        assert kwargs['headers']['apikey'] == 'sua_chave_secreta_aqui'
        assert args[0] == 'http://localhost:8080/message/sendText/sua_instancia'

    @patch('agendamento_publico.services.requests.post')
    def test_enviar_mensagem_falha_nao_crasha_api(self, mock_post):
        # Simular timeout ou exceção de rede (Gateway fora do ar)
        mock_post.side_effect = requests.exceptions.RequestException("Gateway off")
        
        # O método deve lidar graciosamente sem propagar o erro
        result = WhatsAppOTPService.enviar_mensagem('11999999999', 'Teste')
        
        assert result is False
        mock_post.assert_called_once()
