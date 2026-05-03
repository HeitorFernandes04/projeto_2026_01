import { of } from 'rxjs';
import { AutoagendamentoComponent } from './autoagendamento.component';
import { AutoagendamentoPublicoService } from '../../services/autoagendamento-publico.service';

describe('AutoagendamentoComponent — Lógica RF-22 (Motor de Disponibilidade)', () => {
  let component: AutoagendamentoComponent;
  let mockService: any;
  let mockCdr: any;

  beforeEach(() => {
    mockService = {
      getEstabelecimento: vi.fn().mockReturnValue(of({
        id: 1,
        nome_fantasia: 'Teste',
        slug: 'teste-slug',
        servicos: [{ id: 10, nome: 'Lavagem', duracao_estimada_minutos: 30 }]
      })),
      getDisponibilidade: vi.fn().mockReturnValue(of([
        { inicio: '08:00', fim: '08:30' },
        { inicio: '09:00', fim: '09:30' }
      ]))
    };

    const mockRoute = {
      snapshot: { paramMap: { get: vi.fn().mockReturnValue('teste-slug') } }
    } as any;

    const mockRouter = { navigate: vi.fn() } as any;
    mockCdr = { markForCheck: vi.fn() };

    component = new AutoagendamentoComponent(
      mockRoute,
      mockRouter,
      mockService as AutoagendamentoPublicoService,
      mockCdr
    );
    
    component.ngOnInit();
    // Definir estabelecimento e serviço para permitir chamadas de disponibilidade
    component.selecionarServico({ id: 10, nome: 'Lavagem', preco: 50, duracao_estimada_minutos: 30 });
  });

  it('deve carregar horários ao avançar para o passo 2', () => {
    component.avancar(); // Passo 1 -> 2

    expect(component.passo).toBe(2);
    expect(mockService.getDisponibilidade).toHaveBeenCalled();
    expect(component.horariosDisponiveis[0].inicio).toBe('08:00');
  });

  it('deve limpar seleção de horário ao trocar de data', () => {
    component.horarioSelecionado = '08:00';
    const novaData = { objeto: new Date(), dia: 15, mes: 'Mai', semana: 'Qua' };
    
    component.dataSelecionada = novaData;
    
    expect(component.horarioSelecionado).toBeNull();
    expect(mockService.getDisponibilidade).toHaveBeenCalled();
  });

  it('deve limpar seleção de horário ao trocar de serviço', () => {
    component.horarioSelecionado = '08:00';
    component.selecionarServico({ id: 20, nome: 'Outro', preco: 100, duracao_estimada_minutos: 60 });
    
    expect(component.horarioSelecionado).toBeNull();
  });

  it('deve calcular corretamente a data ISO para a API', () => {
    const dataFixa = new Date(2026, 4, 20); // 20 de Maio de 2026
    component.dataSelecionada = { objeto: dataFixa, dia: 20, mes: 'mai', semana: 'qua' };
    
    component.carregarHorarios();
    
    expect(mockService.getDisponibilidade).toHaveBeenCalledWith(
      expect.any(String),
      10,
      '2026-05-20'
    );
  });
});
