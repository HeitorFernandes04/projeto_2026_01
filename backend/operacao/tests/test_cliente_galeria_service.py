import pytest
from django.core.exceptions import PermissionDenied, ValidationError
from django.utils import timezone

from operacao.services import ClienteGaleriaService
from operacao.tests.factories import (
    ClienteFactory,
    MidiaOrdemServicoFactory,
    OrdemServicoFactory,
    ServicoFactory,
    VeiculoFactory,
)


@pytest.mark.django_db
class TestClienteGaleriaService:
    def setup_method(self):
        self.cliente = ClienteFactory(telefone_whatsapp='(11) 99999-0000')
        self.estabelecimento = self.cliente.user.estabelecimento
        self.servico = ServicoFactory()
        self.veiculo = VeiculoFactory(
            estabelecimento=self.servico.estabelecimento,
            cliente=self.cliente,
            celular_dono='11999990000',
        )
        self.ordem = OrdemServicoFactory(
            estabelecimento=self.servico.estabelecimento,
            veiculo=self.veiculo,
            servico=self.servico,
            status='FINALIZADO',
        )

    def test_retorna_midias_de_auditoria_inicial_e_finalizacao_para_cliente(self):
        MidiaOrdemServicoFactory(ordem_servico=self.ordem, momento='VISTORIA_GERAL')
        MidiaOrdemServicoFactory(ordem_servico=self.ordem, momento='AVARIA_PREVIA')
        MidiaOrdemServicoFactory(ordem_servico=self.ordem, momento='FINALIZADO')
        MidiaOrdemServicoFactory(ordem_servico=self.ordem, momento='EXECUCAO')
        MidiaOrdemServicoFactory(ordem_servico=self.ordem, momento='INCIDENTE')
        MidiaOrdemServicoFactory(ordem_servico=self.ordem, momento='ACABAMENTO')
        MidiaOrdemServicoFactory(ordem_servico=self.ordem, momento='PROCESSO')

        galeria = ClienteGaleriaService.montar_galeria_pos_venda(
            ordem_servico_id=self.ordem.id,
            cliente=self.cliente,
        )

        momentos_entrada = {midia.momento for midia in galeria['entrada']}
        momentos_finalizacao = {midia.momento for midia in galeria['finalizacao']}
        assert momentos_entrada == {'VISTORIA_GERAL', 'AVARIA_PREVIA'}
        assert momentos_finalizacao == {'FINALIZADO'}
        assert len(galeria['entrada']) == 2
        assert len(galeria['finalizacao']) == 1

    def test_retorna_laudo_tecnico_com_campos_existentes_no_modelo(self):
        inicio = timezone.now() - timezone.timedelta(minutes=75)
        fim = timezone.now()
        self.ordem.horario_lavagem = inicio
        self.ordem.horario_finalizacao = fim
        self.ordem.observacoes = 'Cliente aprovou entrega no patio.'
        self.ordem.save(
            update_fields=['horario_lavagem', 'horario_finalizacao', 'observacoes'],
        )

        galeria = ClienteGaleriaService.montar_galeria_pos_venda(
            ordem_servico_id=self.ordem.id,
            cliente=self.cliente,
        )

        laudo = galeria['laudo_tecnico']
        assert laudo['servico_realizado'] == self.servico.nome
        assert laudo['tempo_execucao_minutos'] == 75
        assert laudo['observacoes'] == 'Cliente aprovou entrega no patio.'
        assert laudo['status_final'] == 'FINALIZADO'
        assert laudo['placa'] == self.veiculo.placa
        assert laudo['veiculo_modelo'] == self.veiculo.modelo
        assert laudo['unidade'] == self.ordem.estabelecimento.nome_fantasia
        assert laudo['data_servico'] == self.ordem.data_hora
        assert 'produtos_utilizados' not in laudo

    def test_bloqueia_galeria_de_os_nao_finalizada(self):
        self.ordem.status = 'LIBERACAO'
        self.ordem.save(update_fields=['status'])

        with pytest.raises(ValidationError) as exc:
            ClienteGaleriaService.montar_galeria_pos_venda(
                ordem_servico_id=self.ordem.id,
                cliente=self.cliente,
            )

        assert 'finalizadas' in str(exc.value)

    def test_prevencao_idor_por_cliente_diferente(self):
        outro_cliente = ClienteFactory(telefone_whatsapp='11911110000')

        with pytest.raises(PermissionDenied):
            ClienteGaleriaService.montar_galeria_pos_venda(
                ordem_servico_id=self.ordem.id,
                cliente=outro_cliente,
            )

    def test_titularidade_por_telefone_normalizado_sem_fk_cliente(self):
        veiculo_sem_fk = VeiculoFactory(
            estabelecimento=self.servico.estabelecimento,
            cliente=None,
            celular_dono='(11) 99999-0000',
        )
        ordem_sem_fk = OrdemServicoFactory(
            estabelecimento=self.servico.estabelecimento,
            veiculo=veiculo_sem_fk,
            servico=self.servico,
            status='FINALIZADO',
        )
        MidiaOrdemServicoFactory(ordem_servico=ordem_sem_fk, momento='FINALIZADO')

        galeria = ClienteGaleriaService.montar_galeria_pos_venda(
            ordem_servico_id=ordem_sem_fk.id,
            cliente=self.cliente,
        )

        assert len(galeria['finalizacao']) == 1
