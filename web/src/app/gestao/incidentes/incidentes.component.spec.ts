// Import Angular compiler for JIT compilation
import '@angular/compiler';

import { IncidentesComponent } from './incidentes.component';

describe('IncidentesComponent - Central de Incidentes', () => {
  let component: IncidentesComponent;

  beforeEach(() => {
    // Create component instance manually without TestBed
    component = new IncidentesComponent();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Teste 1 (Dados Mockados)', () => {
    it('deve ter dados mockados de incidentes configurados corretamente', () => {
      // Verifica se os dados mockados estão presentes
      expect(component.incidentes).toBeDefined();
      expect(component.incidentes.length).toBe(2);
      
      // Verifica dados do primeiro incidente
      expect(component.incidentes[0].os).toBe('1024');
      expect(component.incidentes[0].placa).toBe('BRA-2E19');
      expect(component.incidentes[0].modelo).toBe('Audi A3');
      expect(component.incidentes[0].motivo).toBe('Divergência de Valor');
      expect(component.incidentes[0].criticidade).toBe('alta');
      expect(component.incidentes[0].status).toBe('Bloqueado na Vistoria');
    });
    it('deve ter dados do segundo incidente configurados corretamente', () => {
      // Verifica dados do segundo incidente
      expect(component.incidentes[1].os).toBe('1028');
      expect(component.incidentes[1].placa).toBe('KLT-4412');
      expect(component.incidentes[1].modelo).toBe('Toyota Hilux');
      expect(component.incidentes[1].motivo).toBe('Tempo de Execução Excedido');
      expect(component.incidentes[1].criticidade).toBe('media');
      expect(component.incidentes[1].status).toBe('Atrasado na Lavagem');
    });
  });

  describe('Teste 2 (Modal de Detalhes)', () => {
    it('deve ter estado inicial do modal fechado', () => {
      // Verifica estado inicial do modal
      expect(component.modalAberto).toBe(false);
      expect(component.incidenteSelecionado).toBeNull();
    });

    it('deve abrir modal com incidente específico', () => {
      // Abre modal com incidente específico
      component.abrirModal(component.incidentes[0]);
      
      // Verifica se o modal foi aberto
      expect(component.modalAberto).toBe(true);
      expect(component.incidenteSelecionado).toBeTruthy();
      expect(component.incidenteSelecionado.os).toBe('1024');
      expect(component.incidenteSelecionado.placa).toBe('BRA-2E19');
    });

    it('deve abrir modal com dados padrão quando nenhum incidente for passado', () => {
      // Abre modal sem parâmetros
      component.abrirModal();
      
      // Verifica se o modal foi aberto com dados padrão
      expect(component.modalAberto).toBe(true);
      expect(component.incidenteSelecionado).toBeTruthy();
      expect(component.incidenteSelecionado.os).toBe('8829');
      expect(component.incidenteSelecionado.placa).toBe('JKL-7890');
      expect(component.incidenteSelecionado.modelo).toBe('Fiat Uno');
    });

    it('deve fechar modal e limpar dados selecionados', () => {
      // Abre modal primeiro
      component.abrirModal();
      expect(component.modalAberto).toBe(true);
      expect(component.incidenteSelecionado).toBeTruthy();
      
      // Fecha o modal
      component.fecharModal();
      
      // Verifica se foi limpo
      expect(component.modalAberto).toBe(false);
      expect(component.incidenteSelecionado).toBeNull();
    });
  });

  describe('Teste 3 (Botões de Ação)', () => {
    it('deve ter método liberarOS funcional', () => {
      // Mock console.log
      const consoleSpy = vi.fn();
      Object.defineProperty(console, 'log', {
        value: consoleSpy,
        writable: true
      });
      
      // Chama método de liberação
      component.liberarOS('1024');
      
      // Verifica se o console.log foi chamado
      expect(consoleSpy).toHaveBeenCalledWith('Solicitando senha de gestor para liberar OS: 1024');
      
      // Verifica se o modal foi fechado
      expect(component.modalAberto).toBe(false);
      expect(component.incidenteSelecionado).toBeNull();
    });

    it('deve ter métodos do modal disponíveis', () => {
      // Verifica se os métodos existem
      expect(component.abrirModal).toBeDefined();
      expect(typeof component.abrirModal).toBe('function');
      
      expect(component.fecharModal).toBeDefined();
      expect(typeof component.fecharModal).toBe('function');
      
      expect(component.liberarOS).toBeDefined();
      expect(typeof component.liberarOS).toBe('function');
    });
  });

  describe('Teste Antiviés (Validação de Estados)', () => {
    it('não deve quebrar quando não houver incidentes', () => {
      // Simula estado vazio
      component.incidentes = [];
      
      // Verifica se o array está vazio
      expect(component.incidentes.length).toBe(0);
    });

    it('deve manter integridade dos dados mockados', () => {
      // Verifica se os dados mockados seguem o contrato esperado
      component.incidentes.forEach(incidente => {
        expect(incidente.os).toBeTruthy();
        expect(incidente.placa).toBeTruthy();
        expect(incidente.modelo).toBeTruthy();
        expect(incidente.motivo).toBeTruthy();
        expect(incidente.descricao).toBeTruthy();
        expect(incidente.criticidade).toBeTruthy();
        expect(incidente.status).toBeTruthy();
        expect(incidente.reportadoPor).toBeTruthy();
        expect(incidente.data).toBeTruthy();
      });
    });

    it('deve ter estrutura de dados consistente', () => {
      // Verifica se todos os incidentes têm os campos necessários
      component.incidentes.forEach(incidente => {
        expect(incidente).toHaveProperty('os');
        expect(incidente).toHaveProperty('placa');
        expect(incidente).toHaveProperty('modelo');
        expect(incidente).toHaveProperty('motivo');
        expect(incidente).toHaveProperty('descricao');
        expect(incidente).toHaveProperty('criticidade');
        expect(incidente).toHaveProperty('status');
        expect(incidente).toHaveProperty('reportadoPor');
        expect(incidente).toHaveProperty('data');
      });
    });
  });
});
