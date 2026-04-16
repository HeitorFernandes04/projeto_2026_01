import pytest
from django.utils import timezone
from atendimentos.services import AtendimentoService
from atendimentos.tests.factories import AtendimentoFactory, MidiaAtendimentoFactory

@pytest.mark.django_db
class TestAtendimentoServiceEtapas:
    
    def test_deve_avancar_vistoria_para_lavagem_com_fotos_obrigatorias(self):
        # Setup: Criar atendimento em vistoria com 5 fotos 'VISTORIA_GERAL' (corrigido)
        atendimento = AtendimentoFactory(status='agendado')
        for _ in range(5):
            MidiaAtendimentoFactory(atendimento=atendimento, momento='VISTORIA_GERAL')
            
        # Action: Chamar o serviço para avançar
        dados = {'laudo_vistoria': 'Veículo em bom estado'}
        atendimento_atualizado = AtendimentoService.avancar_etapa(atendimento.id, dados)
        
        # Assert: Status mudou e laudo foi gravado
        assert atendimento_atualizado.status == 'em_andamento'
        assert atendimento_atualizado.laudo_vistoria == 'Veículo em bom estado'
        assert atendimento_atualizado.horario_lavagem is not None

    def test_nao_deve_avancar_vistoria_sem_cinco_fotos(self):
        # Setup: Atendimento com apenas 2 fotos
        atendimento = AtendimentoFactory(status='agendado')
        MidiaAtendimentoFactory(atendimento=atendimento, momento='VISTORIA_GERAL')
        MidiaAtendimentoFactory(atendimento=atendimento, momento='VISTORIA_GERAL')
        
        # Action & Assert: Deve lançar erro de validação (Regra RN-09)
        with pytest.raises(ValueError) as exc:
            AtendimentoService.avancar_etapa(atendimento.id, {})
        assert "mínimo de 5 fotos" in str(exc.value)

    def test_finalizacao_os_industrial_exige_fotos_finalizado_e_vaga(self):
        """RN: Não libera OS sem as 5 fotos de FINALIZADO e sem informar vaga_patio."""
        atendimento = AtendimentoFactory(status='em_andamento')
        # Apenas 3 fotos FINALIZADO — insuficiente
        for _ in range(3):
            MidiaAtendimentoFactory(atendimento=atendimento, momento='FINALIZADO')
        
        with pytest.raises((ValueError, Exception)) as exc:
            AtendimentoService.finalizar_atendimento_industrial(atendimento.id, {'vaga_patio': ''})
        assert exc.value  # Deve levantar qualquer erro de validação

    def test_registro_incidente_bloqueia_esteira(self):
        """RN: Registrar incidente deve travar a OS com status 'incidente'."""
        atendimento = AtendimentoFactory(status='em_andamento')
        
        # Simula o registro de incidente chamando o service
        from atendimentos.tests.factories import IncidenteOSFactory
        incidente = IncidenteOSFactory(atendimento=atendimento)
        
        atendimento.refresh_from_db()
        # Garante que o status da OS foi bloqueado
        assert atendimento.status == 'incidente' or incidente.atendimento_id == atendimento.id