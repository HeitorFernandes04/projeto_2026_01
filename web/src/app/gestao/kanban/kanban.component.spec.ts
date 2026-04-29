import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import '@angular/compiler';

import { KanbanComponent } from './kanban.component';
import { KanbanService, KanbanData } from '../../services/kanban.service';
import { IncidentesService } from '../../services/incidentes.service';
import { of, throwError } from 'rxjs';

const mockKanban: KanbanData = {
  PATIO: [
    { id: 1, placa: 'ABC-1234', modelo: 'Gol', servico: 'Lavagem Completa', duracao_estimada_minutos: 45, tempo_decorrido_minutos: 0, is_atrasado: false },
    { id: 2, placa: 'DEF-9012', modelo: 'Civic', servico: 'Higienização', duracao_estimada_minutos: 90, tempo_decorrido_minutos: 0, is_atrasado: false },
  ],
  LAVAGEM: [
    { id: 3, placa: 'GHI-3456', modelo: 'Corolla', servico: 'Polimento', duracao_estimada_minutos: 60, tempo_decorrido_minutos: 30, is_atrasado: false },
    { id: 4, placa: 'JKL-7890', modelo: 'Onix', servico: 'Lavagem Simples', duracao_estimada_minutos: 30, tempo_decorrido_minutos: 45, is_atrasado: true },
  ],
  FINALIZADO_HOJE: [
    { id: 5, placa: 'MNO-1111', modelo: 'HB20', servico: 'Lavagem Simples', duracao_estimada_minutos: 30, tempo_decorrido_minutos: 28, is_atrasado: false },
  ],
  INCIDENTES: [],
};

describe('KanbanComponent — RF-14', () => {
  let component: KanbanComponent;
  let routerSpy: any;
  let kanbanServiceSpy: any;
  let incidentesServiceSpy: any;
  let cdrSpy: any;

  beforeEach(() => {
    routerSpy        = { navigate: vi.fn() };
    cdrSpy           = { markForCheck: vi.fn() };
    kanbanServiceSpy = { obterKanban: vi.fn().mockReturnValue(of(mockKanban)) };
    incidentesServiceSpy = {
      totalPendentes$: of(3),
      iniciarMonitoramentoPendentes: vi.fn(),
      pararMonitoramentoPendentes: vi.fn(),
    };

    component = new KanbanComponent(
      routerSpy as Router,
      kanbanServiceSpy as KanbanService,
      incidentesServiceSpy as IncidentesService,
      cdrSpy as ChangeDetectorRef,
    );
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Estrutura de Colunas', () => {
    it('deve ter 4 colunas configuradas em COLUNAS_CONFIG', () => {
      expect(component.COLUNAS_CONFIG.length).toBe(4);
    });

    it('deve conter as 4 novas chaves operacionais', () => {
      const chaves = component.COLUNAS_CONFIG.map(c => c.chave);
      expect(chaves).toContain('PATIO');
      expect(chaves).toContain('LAVAGEM');
      expect(chaves).toContain('FINALIZADO_HOJE');
      expect(chaves).toContain('INCIDENTES');
    });

    it('não deve conter as chaves antigas de colunas individuais', () => {
      const chaves = component.COLUNAS_CONFIG.map(c => c.chave);
      expect(chaves).not.toContain('VISTORIA_INICIAL');
      expect(chaves).not.toContain('EM_EXECUCAO');
      expect(chaves).not.toContain('LIBERACAO');
    });
  });

  describe('Carregamento via API', () => {
    it('deve monitorar incidentes pendentes para o badge do header', () => {
      component.ngOnInit();
      expect(component.totalIncidentesPendentes).toBe(3);
      expect(incidentesServiceSpy.iniciarMonitoramentoPendentes).toHaveBeenCalled();
      component.ngOnDestroy();
    });

    it('deve carregar dados do kanban ao chamar carregarKanban()', () => {
      component.carregarKanban();
      expect(component.kanban).toEqual(mockKanban);
      expect(component.carregando).toBe(false);
      expect(component.erro).toBe(false);
    });

    it('deve ativar flag de erro quando a API falha', () => {
      kanbanServiceSpy.obterKanban.mockReturnValue(throwError(() => new Error('500')));
      component.carregarKanban();
      expect(component.erro).toBe(true);
      expect(component.carregando).toBe(false);
    });
  });

  describe('cardsDeColuna()', () => {
    beforeEach(() => component.carregarKanban());

    it('deve retornar os cards corretos para PATIO', () => {
      expect(component.cardsDeColuna('PATIO').length).toBe(2);
    });

    it('deve retornar os cards da coluna LAVAGEM unificada', () => {
      expect(component.cardsDeColuna('LAVAGEM').length).toBe(2);
    });

    it('deve retornar array vazio para colunas sem cards', () => {
      expect(component.cardsDeColuna('INCIDENTES').length).toBe(0);
    });
  });

  describe('Métricas calculadas', () => {
    beforeEach(() => component.carregarKanban());

    it('totalEmOperacao deve somar todos os cards', () => {
      // PATIO(2) + LAVAGEM(2) + FINALIZADO_HOJE(1) + INCIDENTES(0) = 5
      expect(component.totalEmOperacao).toBe(5);
    });

    it('eficienciaPercent deve refletir proporção de cards no prazo', () => {
      // 4 no prazo de 5 total = 80%
      expect(component.eficienciaPercent).toBe(80);
    });
  });

  describe('Helpers de formatação', () => {
    it('formatarTempo deve converter minutos em HH:MM', () => {
      expect(component.formatarTempo(90)).toBe('01:30');
      expect(component.formatarTempo(5)).toBe('00:05');
    });

    it('calcularProgresso não deve exceder 100', () => {
      const card = mockKanban.LAVAGEM[1]; // tempo_decorrido 45, estimado 30
      expect(component.calcularProgresso(card)).toBe(100);
    });

    it('calcularProgresso deve ser 0 para duracao_estimada_minutos = 0', () => {
      const card = { ...mockKanban.PATIO[0], duracao_estimada_minutos: 0 };
      expect(component.calcularProgresso(card)).toBe(0);
    });

    it('calcularProgresso para PATIO deve ser 0 (tempo zero)', () => {
      const card = mockKanban.PATIO[0]; // tempo_decorrido_minutos: 0
      expect(component.calcularProgresso(card)).toBe(0);
    });
  });

  describe('Navegação', () => {
    it('deve navegar para /gestao/incidentes', () => {
      component.irParaIncidentes();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/gestao/incidentes']);
    });
  });
});
