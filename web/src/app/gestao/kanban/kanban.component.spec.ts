import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

// Import Angular compiler for JIT compilation
import '@angular/compiler';

import { KanbanComponent } from './kanban.component';

describe('KanbanComponent - Pátio', () => {
  let component: KanbanComponent;
  let routerSpy: any;

  beforeEach(() => {
    routerSpy = {
      navigate: vi.fn()
    };

    // Create component instance manually without TestBed
    component = new KanbanComponent(routerSpy);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Teste 1 (Estrutura)', () => {
    it('deve ter 4 colunas obrigatórias com dados mockados', () => {
      // Verifica se os dados mockados estão presentes no componente
      expect(component.colunas).toBeDefined();
      expect(component.colunas.length).toBe(4);
      
      // Verifica nomes das colunas
      const columnNames = component.colunas.map(col => col.nome);
      expect(columnNames).toEqual(['PÁTIO', 'VISTORIA', 'LAVAGEM / ACABAMENTO', 'LIBERAÇÃO']);
      
      // Verifica cores das colunas
      const columnColors = component.colunas.map(col => col.cor);
      expect(columnColors).toEqual(['#007bff', '#6610f2', '#fd7e14', '#28a745']);
    });

    it('deve manter estrutura consistente com dados mockados', () => {
      // Verifica dados da primeira coluna (PÁTIO)
      expect(component.colunas[0].nome).toBe('PÁTIO');
      expect(component.colunas[0].cor).toBe('#007bff');
      expect(component.colunas[0].cards.length).toBe(2);
      expect(component.colunas[0].cards[0].placa).toBe('ABC-1234');
      expect(component.colunas[0].cards[0].alerta).toBe(false);
    });
  });

  describe('Teste 3 (Lógica de Incidente)', () => {
    it('deve carregar a contagem real de incidentes pendentes para o alerta visual', () => {
      const incidenteService = {
        listarPendentes: vi.fn(() => of([{ id: 1 }, { id: 2 }]))
      };
      component = new KanbanComponent(routerSpy, incidenteService as any);

      component.ngOnInit();

      expect(incidenteService.listarPendentes).toHaveBeenCalled();
      expect(component.incidentesPendentes).toBe(2);
    });

    it('deve zerar alerta visual se a consulta de incidentes falhar', () => {
      const incidenteService = {
        listarPendentes: vi.fn(() => throwError(() => new Error('falha')))
      };
      component = new KanbanComponent(routerSpy, incidenteService as any);

      component.ngOnInit();

      expect(component.incidentesPendentes).toBe(0);
    });

    it('deve ter cards com alerta configurados corretamente', () => {
      // Verifica se há cards com incidente nos dados mockados
      const incidentCards = component.colunas.flatMap(col => 
        col.cards.filter(card => card.alerta === true)
      );
      expect(incidentCards.length).toBe(1);
      expect(incidentCards[0].placa).toBe('DEF-9012');
      expect(incidentCards[0].servico).toBe('Higienização');
    });

    it('deve ter cards sem incidente configurados corretamente', () => {
      // Verifica cards sem incidente
      const normalCards = component.colunas.flatMap(col => 
        col.cards.filter(card => card.alerta === false)
      );
      expect(normalCards.length).toBe(4);
      
      // Verifica se não têm alerta
      normalCards.forEach(card => {
        expect(card.alerta).toBe(false);
      });
    });
  });

  describe('Teste 5 (Cards)', () => {
    it('deve exibir dados dos veículos corretamente', () => {
      // Verifica dados do primeiro card
      const firstCard = component.colunas[0].cards[0];
      expect(firstCard.placa).toBe('ABC-1234');
      expect(firstCard.modelo).toBe('Toyota Corolla');
      expect(firstCard.servico).toBe('Lavagem Completa');
      expect(firstCard.tempo).toBe('15min');
      expect(firstCard.status).toBe('em-espera');
      expect(firstCard.alerta).toBe(false);
    });

    it('deve manter estrutura de dados consistente', () => {
      // Verifica se todos os cards têm os campos necessários
      component.colunas.forEach(coluna => {
        coluna.cards.forEach(card => {
          expect(card).toHaveProperty('placa');
          expect(card).toHaveProperty('modelo');
          expect(card).toHaveProperty('servico');
          expect(card).toHaveProperty('tempo');
          expect(card).toHaveProperty('status');
          expect(card).toHaveProperty('alerta');
          expect(typeof card.alerta).toBe('boolean');
        });
      });
    });

    it('deve ter método irParaIncidentes funcional', () => {
      expect(component.irParaIncidentes).toBeDefined();
      expect(typeof component.irParaIncidentes).toBe('function');
      
      component.irParaIncidentes();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/gestao/incidentes']);
    });
  });

  describe('Teste Antiviés (Validação de Estados)', () => {
    it('não deve quebrar quando não houver dados nas colunas', () => {
      // Simula estado vazio
      component.colunas = [];
      
      // Verifica se o array do componente está vazio
      expect(component.colunas.length).toBe(0);
    });

    it('deve manter integridade dos dados mockados', () => {
      // Verifica se os dados mockados seguem o contrato esperado
      component.colunas.forEach(coluna => {
        expect(coluna.nome).toBeTruthy();
        expect(coluna.cor).toBeTruthy();
        expect(Array.isArray(coluna.cards)).toBeTruthy();
        
        coluna.cards.forEach((card: any) => {
          expect(card.placa).toBeTruthy();
          expect(card.modelo).toBeTruthy();
          expect(card.servico).toBeTruthy();
          expect(card.tempo).toBeTruthy();
          expect(typeof card.alerta).toBe('boolean');
        });
      });
    });

    it('deve ter contagem total de cards correta', () => {
      // Verifica contagem total de cards
      const totalCards = component.colunas.reduce((total, col) => total + col.cards.length, 0);
      expect(totalCards).toBe(5);
    });
  });
});
