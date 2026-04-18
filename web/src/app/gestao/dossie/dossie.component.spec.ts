import { Router } from '@angular/router';

// Import Angular compiler for JIT compilation
import '@angular/compiler';

import { DossieComponent } from './dossie.component';

describe('DossieComponent - Dossiê da Ordem de Serviço', () => {
  let component: DossieComponent;
  let routerSpy: any;

  beforeEach(() => {
    routerSpy = {
      navigate: vi.fn()
    };

    // Create component instance manually without TestBed
    component = new DossieComponent(routerSpy);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Teste 1 (Dados Mockados)', () => {
    it('deve ter dados mockados do dossiê configurados corretamente', () => {
      // Verifica se os dados mockados estão presentes
      expect(component.dossie).toBeDefined();
      expect(component.dossie.os).toBe('OS-001234');
      expect(component.dossie.placa).toBe('ABC-1234');
      expect(component.dossie.modelo).toBe('Toyota Corolla - Prata');
      expect(component.dossie.cliente).toBe('João Silva');
      expect(component.dossie.total).toBe(120.00);
    });

    it('deve ter lista de serviços configurada', () => {
      // Verifica se os serviços estão presentes
      expect(component.dossie.servicos).toBeDefined();
      expect(component.dossie.servicos.length).toBe(2);
      expect(component.dossie.servicos[0].nome).toBe('Lavagem Completa');
      expect(component.dossie.servicos[0].preco).toBe(80.00);
    });

    it('deve ter fotos de entrada e saída configuradas', () => {
      // Verifica se as fotos estão presentes
      expect(component.dossie.fotosEntrada).toBeDefined();
      expect(component.dossie.fotosSaida).toBeDefined();
      expect(component.dossie.fotosEntrada.length).toBe(2);
      expect(component.dossie.fotosSaida.length).toBe(1);
    });
  });

  describe('Teste 2 (Métodos de Navegação)', () => {
    it('deve ter método voltar funcional', () => {
      // Mock window.history.back
      const historyBackSpy = vi.fn();
      Object.defineProperty(window.history, 'back', {
        value: historyBackSpy,
        writable: true
      });
      
      component.voltar();
      expect(historyBackSpy).toHaveBeenCalled();
    });

    it('deve ter método irParaIncidentes funcional', () => {
      expect(component.irParaIncidentes).toBeDefined();
      expect(typeof component.irParaIncidentes).toBe('function');
      
      component.irParaIncidentes();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/gestao/incidentes']);
    });
  });

  describe('Teste Antiviés (Validação de Estados)', () => {
    it('deve manter integridade dos dados mockados', () => {
      // Verifica se os dados mockados seguem o contrato esperado
      expect(component.dossie).toHaveProperty('os');
      expect(component.dossie).toHaveProperty('data');
      expect(component.dossie).toHaveProperty('placa');
      expect(component.dossie).toHaveProperty('modelo');
      expect(component.dossie).toHaveProperty('cliente');
      expect(component.dossie).toHaveProperty('servicos');
      expect(component.dossie).toHaveProperty('fotosEntrada');
      expect(component.dossie).toHaveProperty('fotosSaida');
      expect(component.dossie).toHaveProperty('total');
    });

    it('deve ter estrutura de dados consistente nos serviços', () => {
      // Verifica se todos os serviços têm os campos necessários
      component.dossie.servicos.forEach(servico => {
        expect(servico).toHaveProperty('nome');
        expect(servico).toHaveProperty('preco');
        expect(typeof servico.preco).toBe('number');
      });
    });
  });
});
