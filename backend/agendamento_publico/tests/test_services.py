import pytest
from django.core.exceptions import PermissionDenied, ValidationError

from accounts.models import Cliente, User
from agendamento_publico.services import AuthB2CService
from operacao.tests.factories import EstabelecimentoFactory, VeiculoFactory


@pytest.mark.django_db
class TestAuthB2CService:
    def test_setup_cria_usuario_b2c_cliente_e_tokens(self):
        estabelecimento = EstabelecimentoFactory()
        VeiculoFactory(
            estabelecimento=estabelecimento,
            placa='ABC1234',
            nome_dono='Cliente Teste',
            celular_dono='11999999999',
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
        assert set(result.keys()) == {'access', 'refresh'}

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

        assert set(result.keys()) == {'access', 'refresh'}

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
