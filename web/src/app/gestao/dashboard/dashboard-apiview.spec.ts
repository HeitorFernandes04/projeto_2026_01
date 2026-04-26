import { Router } from '@angular/router';
import { of } from 'rxjs';

// Import Angular compiler for JIT compilation
import '@angular/compiler';

import { DashboardAPIView } from './dashboard-apiview';

describe('DashboardAPIView', () => {
  let component: DashboardAPIView;
  let routerSpy: any;
  let mockDashboardService: any;
  let mockCdRef: any;

  beforeEach(() => {
    routerSpy = {
      navigate: vi.fn()
    };
    
    mockDashboardService = {
      getIndicadores: vi.fn().mockReturnValue(of({
        totalOsFinalizadas: 5,
        receitaTotal: 100,
        volume_por_hora: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        receita_semanal: [],
        incidentesAtivos: 2
      })),
      getEficienciaEquipe: vi.fn().mockReturnValue(of([
        { funcionarioId: 1, nomeFuncionario: 'Lavador X', totalOs: 5, tempoTotalEstimadoMinutos: 100, tempoTotalRealMinutos: 90, desvioTotalMinutos: -10 }
      ])),
      getEntradasRecentes: vi.fn().mockReturnValue(of([]))
    };
    
    mockCdRef = {
      detectChanges: vi.fn()
    };

    // Create component instance manually without TestBed
    component = new DashboardAPIView(routerSpy, mockDashboardService, mockCdRef);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Teste de Inicialização (Dashboard API)', () => {
    it('deve chamar carregarDados no ngOnInit', () => {
      const spi = vi.spyOn(component, 'carregarDados');
      component.ngOnInit();
      expect(spi).toHaveBeenCalled();
      expect(mockDashboardService.getIndicadores).toHaveBeenCalled();
      expect(mockDashboardService.getEficienciaEquipe).toHaveBeenCalled();
    });

    it('deve formatar as métricas na tela usando os Observables', () => {
      component.carregarDados();
      expect(component.receitaHoje).toBe(100);
      expect(component.veiculosHoje).toBe(5);
      expect(component.incidentesAtivos).toBe(2);
      expect(mockCdRef.detectChanges).toHaveBeenCalled();
    });

    it('deve ter método irParaIncidentes disponível', () => {
      expect(component.irParaIncidentes).toBeDefined();
      expect(typeof component.irParaIncidentes).toBe('function');
    });

    it('deve navegar para incidentes ao chamar irParaIncidentes', () => {
      component.irParaIncidentes();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/gestao/incidentes']);
    });
  });

  describe('Teste de Eficiência API', () => {
    it('deve renderizar o Ranking baseado na API', () => {
      component.carregarDados();
      // Verifica se o array rankingEficiencia está populado
      expect(component.rankingEficiencia.length).toBe(1);
      expect(component.rankingEficiencia[0].nomeFuncionario).toBe('Lavador X');
      expect(component.rankingEficiencia[0].desvioTotalMinutos).toBe(-10);
    });

    it('deve calcular o tempo médio', () => {
      component.carregarDados();
      // 90 / 5 = 18
      expect(component.tempoMedio).toBe(18);
    });
  });

  describe('Teste Antiviés (Validação de Estados API)', () => {
    it('não deve quebrar quando ranking retornar vazio', () => {
      mockDashboardService.getEficienciaEquipe.mockReturnValue(of([]));
      component.carregarDados();
      
      expect(component.rankingEficiencia.length).toBe(0);
      expect(component.tempoMedio).toBe(0);
    });
  });
});
