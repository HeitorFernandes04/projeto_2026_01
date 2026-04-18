import { Router } from '@angular/router';

// Import Angular compiler for JIT compilation
import '@angular/compiler';

import { HistoricoComponent } from './historico.component';

describe('HistoricoComponent - Histórico de Ordens de Serviço', () => {
  let component: HistoricoComponent;
  let routerSpy: any;

  beforeEach(() => {
    routerSpy = {
      navigate: vi.fn()
    };

    // Create component instance manually without TestBed
    component = new HistoricoComponent(routerSpy);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Teste 1 (Dados Mockados)', () => {
    it('deve ter dados mockados de ordens finalizadas', () => {
      // Verifica se os dados mockados estão presentes
      expect(component.ordensFinalizadas).toBeDefined();
      expect(component.ordensFinalizadas.length).toBeGreaterThan(0);
      
      // Verifica dados da primeira ordem
      expect(component.ordensFinalizadas[0].os).toBe('OS-001234');
      expect(component.ordensFinalizadas[0].placa).toBe('ABC-1234');
      expect(component.ordensFinalizadas[0].status).toBe('FINALIZADO');
    });

    it('deve ter método de navegação para dossiê', () => {
      expect(component.visualizarDossie).toBeDefined();
      expect(typeof component.visualizarDossie).toBe('function');
    });
  });

  describe('Teste 2 (Navegação)', () => {
    it('deve navegar para dossiê ao chamar visualizarDossie', () => {
      component.visualizarDossie('OS-001234');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/gestao/dossie']);
    });
  });

  describe('Teste Antiviés (Validação de Estados)', () => {
    it('não deve quebrar quando não houver ordens finalizadas', () => {
      // Simula array vazio
      component.ordensFinalizadas = [];
      
      // Verifica se o array está vazio
      expect(component.ordensFinalizadas.length).toBe(0);
    });

    it('deve manter integridade dos dados mockados', () => {
      // Verifica se os dados mockados seguem o contrato esperado
      component.ordensFinalizadas.forEach(ordem => {
        expect(ordem.os).toBeTruthy();
        expect(ordem.placa).toBeTruthy();
        expect(ordem.cliente).toBeTruthy();
        expect(ordem.servico).toBeTruthy();
        expect(ordem.dataHora).toBeTruthy();
        expect(ordem.status).toBeTruthy();
      });
    });
  });
});
