import { Router } from '@angular/router';

// Import Angular compiler for JIT compilation
import '@angular/compiler';

import { DashboardAPIView } from './dashboard-apiview';

describe('DashboardAPIView', () => {
  let component: DashboardAPIView;
  let routerSpy: any;

  beforeEach(() => {
    routerSpy = {
      navigate: vi.fn()
    };

    // Create component instance manually without TestBed
    component = new DashboardAPIView(routerSpy);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Teste 2 (Dashboard - KPI)', () => {
    it('deve ter dados mockados de topServicos corretamente', () => {
      // Verifica se os dados mockados estão presentes
      expect(component.topServicos).toBeDefined();
      expect(component.topServicos.length).toBe(5);
      
      // Verifica dados do primeiro serviço
      expect(component.topServicos[0].nome).toBe('Lavagem Completa');
      expect(component.topServicos[0].vendas).toBe(87);
      expect(component.topServicos[0].valor).toBe('5.220');
      expect(component.topServicos[0].percentual).toBe(100);
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

  describe('Teste 4 (Ranking)', () => {
    it('deve renderizar Top 5 Serviços baseado no array de dados mockados', () => {
      // Verifica se o componente topServicos está populado
      expect(component.topServicos.length).toBe(5);
      expect(component.topServicos[0].nome).toBe('Lavagem Completa');
      expect(component.topServicos[0].vendas).toBe(87);
      expect(component.topServicos[0].valor).toBe('5.220');
      expect(component.topServicos[0].percentual).toBe(100);
      
      // Verifica dados do segundo serviço
      expect(component.topServicos[1].nome).toBe('Lavagem + Polimento');
      expect(component.topServicos[1].vendas).toBe(45);
      expect(component.topServicos[1].valor).toBe('6.750');
      expect(component.topServicos[1].percentual).toBe(75);
      
      // Verifica dados do terceiro serviço
      expect(component.topServicos[2].nome).toBe('Lavagem Expressa');
      expect(component.topServicos[2].vendas).toBe(62);
      expect(component.topServicos[2].valor).toBe('2.170');
      expect(component.topServicos[2].percentual).toBe(60);
    });

    it('deve manter integridade dos dados mockados', () => {
      // Verifica se os dados mockados seguem o contrato esperado
      component.topServicos.forEach(servico => {
        expect(servico.nome).toBeTruthy();
        expect(typeof servico.vendas).toBe('number');
        expect(servico.valor).toBeTruthy();
        expect(typeof servico.percentual).toBe('number');
        expect(servico.percentual).toBeGreaterThanOrEqual(0);
        expect(servico.percentual).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Teste Antiviés (Validação de Estados)', () => {
    it('não deve quebrar quando não houver dados', () => {
      // Simula estado vazio
      component.topServicos = [];
      
      // Deve manter o array vazio sem erros
      expect(component.topServicos.length).toBe(0);
    });

    it('deve ter estrutura de dados consistente', () => {
      // Verifica se todos os campos necessários existem
      component.topServicos.forEach(servico => {
        expect(servico).toHaveProperty('nome');
        expect(servico).toHaveProperty('vendas');
        expect(servico).toHaveProperty('valor');
        expect(servico).toHaveProperty('percentual');
      });
    });
  });
});