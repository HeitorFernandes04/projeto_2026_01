import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import '@angular/compiler';

import { HistoricoComponent } from './historico.component';
import { HistoricoService } from '../../services/historico.service';
import { of, throwError } from 'rxjs';

const mockResponse = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      placa: 'ABC-1234',
      modelo: 'Gol',
      servico_nome: 'Lavagem Completa',
      funcionario_nome: 'Carlos',
      status: 'FINALIZADO',
      data_hora: '2026-04-14T14:30:00Z',
      horario_lavagem: null,
      horario_finalizacao: null,
    },
    {
      id: 2,
      placa: 'XYZ-5678',
      modelo: 'Civic',
      servico_nome: 'Polimento',
      funcionario_nome: 'Ana',
      status: 'CANCELADO',
      data_hora: '2026-04-14T15:15:00Z',
      horario_lavagem: null,
      horario_finalizacao: null,
    },
  ],
};

describe('HistoricoComponent — RF-17', () => {
  let component: HistoricoComponent;
  let routerSpy: any;
  let serviceSpy: any;
  let cdrSpy: any;

  beforeEach(() => {
    routerSpy  = { navigate: vi.fn() };
    cdrSpy     = { markForCheck: vi.fn() };
    serviceSpy = { buscarHistorico: vi.fn().mockReturnValue(of(mockResponse)) };

    component = new HistoricoComponent(routerSpy as Router, serviceSpy as HistoricoService, cdrSpy as ChangeDetectorRef);
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Inicialização', () => {
    it('deve chamar buscar() no ngOnInit', () => {
      const spy = vi.spyOn(component, 'buscar');
      component.ngOnInit();
      expect(spy).toHaveBeenCalledOnce();
    });

    it('deve preencher ordens com dados da API', () => {
      component.ngOnInit();
      expect(component.ordens.length).toBe(2);
      expect(component.totalItens).toBe(2);
    });

    it('deve desligar o estado de carregando após sucesso', () => {
      component.ngOnInit();
      expect(component.carregando).toBe(false);
    });
  });

  describe('Filtros', () => {
    it('deve passar filtro de placa ao service', () => {
      component.filtroPlaca = 'ABC';
      component.buscar();
      expect(serviceSpy.buscarHistorico).toHaveBeenCalledWith(
        expect.objectContaining({ placa: 'ABC' })
      );
    });

    it('deve passar filtro de status ao service', () => {
      component.filtroStatus = 'FINALIZADO';
      component.buscar();
      expect(serviceSpy.buscarHistorico).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'FINALIZADO' })
      );
    });

    it('deve limpar todos os filtros e rebuscar ao chamar limparFiltros()', () => {
      component.filtroPlaca      = 'ABC';
      component.filtroStatus     = 'FINALIZADO';
      component.filtroDataInicio = '2026-04-01';
      component.filtroDataFim    = '2026-04-14';
      component.limparFiltros();
      expect(component.filtroPlaca).toBe('');
      expect(component.filtroStatus).toBe('');
      expect(serviceSpy.buscarHistorico).toHaveBeenCalledTimes(1);
    });
  });

  describe('Paginação', () => {
    it('deve calcular totalPaginas corretamente', () => {
      component.totalItens = 30;
      expect(component.totalPaginas).toBe(2);
    });

    it('não deve mudar página além do limite máximo', () => {
      component.totalItens = 15;
      component.paginaAtual = 1;
      component.mudarPagina(2);
      expect(serviceSpy.buscarHistorico).toHaveBeenCalledTimes(0);
    });

    it('não deve ir para página 0', () => {
      component.paginaAtual = 1;
      component.mudarPagina(0);
      expect(serviceSpy.buscarHistorico).toHaveBeenCalledTimes(0);
    });
  });

  describe('Tratamento de Erro', () => {
    it('deve ativar flag de erro quando API falha', () => {
      serviceSpy.buscarHistorico.mockReturnValue(throwError(() => ({ status: 500 })));
      component.ngOnInit();
      expect(component.erro).toBe(true);
      expect(component.carregando).toBe(false);
    });

    it('deve exibir mensagem de erro de datas quando API retorna 400', () => {
      serviceSpy.buscarHistorico.mockReturnValue(
        throwError(() => ({ status: 400, error: { detail: 'A data inicial não pode ser maior que a data final.' } }))
      );
      component.ngOnInit();
      expect(component.erroDatas).toBeTruthy();
    });
  });

  describe('Navegação', () => {
    it('deve navegar para /gestao/dossie/:id ao chamar visualizarDossie', () => {
      component.visualizarDossie(42);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/gestao/dossie', 42]);
    });

    it('deve navegar para /gestao/incidentes ao chamar irParaIncidentes', () => {
      component.irParaIncidentes();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/gestao/incidentes']);
    });
  });

  describe('Helpers', () => {
    it('deve formatar data ISO corretamente', () => {
      const resultado = component.formatarData('2026-04-14T14:30:00Z');
      expect(resultado).toContain('ABR');
      expect(resultado).toContain('2026');
    });

    it('deve retornar "-" para data vazia', () => {
      expect(component.formatarData('')).toBe('-');
    });

    it('deve mapear statusLabel corretamente', () => {
      expect(component.statusLabel('FINALIZADO')).toBe('Finalizado');
      expect(component.statusLabel('CANCELADO')).toBe('Cancelado');
      expect(component.statusLabel('EM_EXECUCAO')).toBe('Em Execução');
    });

    it('deve retornar class correta por status', () => {
      expect(component.statusClass('FINALIZADO')).toBe('pill-green');
      expect(component.statusClass('CANCELADO')).toBe('pill-red');
      expect(component.statusClass('BLOQUEADO_INCIDENTE')).toBe('pill-orange');
      expect(component.statusClass('PATIO')).toBe('pill-gray');
    });
  });
});
