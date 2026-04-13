import pytest
from django.utils import timezone
from atendimentos.services import AtendimentoService
from atendimentos.tests.factories import AtendimentoFactory, MidiaAtendimentoFactory

@pytest.mark.django_db
class TestAtendimentoServiceEtapas:
    
    def test_deve_avancar_vistoria_para_lavagem_com_fotos_obrigatorias(self):
        # Setup: Criar atendimento em vistoria com 5 fotos 'ANTES'
        atendimento = AtendimentoFactory(status='agendado')
        for _ in range(5):
            MidiaAtendimentoFactory(atendimento=atendimento, momento='ANTES')
            
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
        MidiaAtendimentoFactory(atendimento=atendimento, momento='ANTES')
        MidiaAtendimentoFactory(atendimento=atendimento, momento='ANTES')
        
        # Action & Assert: Deve lançar erro de validação (Regra RN-09)
        with pytest.raises(ValueError) as exc:
            AtendimentoService.avancar_etapa(atendimento.id, {})
        assert "mínimo de 5 fotos" in str(exc.value)