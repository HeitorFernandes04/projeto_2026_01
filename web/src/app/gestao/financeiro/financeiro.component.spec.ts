import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FinanceiroComponent } from './financeiro.component';
import { FinanceiroService } from '../../services/financeiro.service';

describe('FinanceiroComponent', () => {
  let component: FinanceiroComponent;
  let mockFinanceiroService: { getResumo: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockFinanceiroService = {
      getResumo: vi.fn().mockReturnValue(of({
        estabelecimento_nome: 'Lava-Me Centro',
        total_faturado: '150.00',
        transacoes: [
          { id: 1, horario_finalizacao: '2026-05-27T10:00:00Z', veiculo: 'Uno - ABC1234', servico: 'Lavagem Simples', valor_cobrado: '50.00' },
          { id: 2, horario_finalizacao: '2026-05-27T11:00:00Z', veiculo: 'Gol - DEF5678', servico: 'Lavagem Completa', valor_cobrado: '100.00' }
        ]
      }))
    };

    await TestBed.configureTestingModule({
      imports: [FinanceiroComponent],
      providers: [
        { provide: FinanceiroService, useValue: mockFinanceiroService }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(FinanceiroComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Inicialização', () => {
    it('deve inicializar o período com o primeiro dia do mês até hoje e carregar o resumo', () => {
      const spyCarregar = vi.spyOn(component, 'carregarResumo');
      component.ngOnInit();
      expect(component.dataInicio).toBeDefined();
      expect(component.dataFim).toBeDefined();
      expect(spyCarregar).toHaveBeenCalled();
      expect(mockFinanceiroService.getResumo).toHaveBeenCalledWith(component.dataInicio, component.dataFim);
    });
  });

  describe('Cálculos Financeiros', () => {
    it('deve calcular corretamente total de serviços e ticket médio', () => {
      component.carregarResumo();
      expect(component.totalServicos).toBe(2);
      expect(component.ticketMedio).toBe(75.0); // 150 / 2 = 75
    });

    it('deve retornar 0 para ticket médio caso não existam transações', () => {
      mockFinanceiroService.getResumo.mockReturnValue(of({
        estabelecimento_nome: 'Lava-Me Centro',
        total_faturado: '0.00',
        transacoes: []
      }));
      component.carregarResumo();
      expect(component.totalServicos).toBe(0);
      expect(component.ticketMedio).toBe(0);
    });
  });

  describe('Formatação BRL', () => {
    it('deve formatar valores para o formato BRL corretamente', () => {
      expect(component.formatBRL('150.00')).toBe('R$ 150,00');
      expect(component.formatBRL(75)).toBe('R$ 75,00');
      expect(component.formatBRL(undefined)).toBe('R$ 0,00');
      expect(component.formatBRL(0)).toBe('R$ 0,00');
    });
  });

  describe('Tratamento de Erro', () => {
    it('deve preencher a mensagem de erro se a requisição falhar', () => {
      mockFinanceiroService.getResumo.mockReturnValue(throwError(() => new Error('Error')));
      component.carregarResumo();
      expect(component.loading).toBe(false);
      expect(component.errorMsg).toContain('Erro ao carregar dados financeiros');
    });
  });
});
