import { Router } from '@angular/router';
import { of } from 'rxjs';
import { DatePipe } from '@angular/common';

// Import Angular compiler for JIT compilation
import '@angular/compiler';

import { HistoricoComponent } from './historico.component';
import { HistoricoService } from '../../services/historico.service';

describe('HistoricoComponent - Histórico de Ordens de Serviço', () => {
  let component: HistoricoComponent;
  let routerSpy: any;
  let historicoServiceSpy: any;
  let datePipeSpy: any;

  beforeEach(() => {
    routerSpy = {
      navigate: vi.fn()
    };
    
    historicoServiceSpy = {
      buscarHistorico: vi.fn().mockReturnValue(of({ results: [
        {
          id: 1234,
          data_hora: '2026-04-14T14:30:00Z',
          veiculo: { placa: 'ABC-1234' },
          funcionario: { name: 'João Silva' },
          servico: { nome: 'Lavagem Completa' },
          status: 'FINALIZADO',
          status_display: 'Finalizado'
        }
      ] }))
    };

    datePipeSpy = new DatePipe('en-US');

    // Create component instance manually without TestBed
    component = new HistoricoComponent(routerSpy, historicoServiceSpy, datePipeSpy);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Teste 1 (Integração com API)', () => {
    it('deve buscar dados da API ao inicializar', () => {
      component.ngOnInit();
      expect(historicoServiceSpy.buscarHistorico).toHaveBeenCalled();
      expect(component.ordensFinalizadas.length).toBeGreaterThan(0);
      
      // Verifica dados da primeira ordem vinda da API
      expect(component.ordensFinalizadas[0].id).toBe(1234);
      expect(component.ordensFinalizadas[0].veiculo.placa).toBe('ABC-1234');
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

  describe('Teste Antiviés (Validação de Estados da API)', () => {
    it('não deve quebrar quando API retornar array vazio', () => {
      historicoServiceSpy.buscarHistorico = vi.fn().mockReturnValue(of({ results: [] }));
      component.aplicarFiltros();
      expect(component.ordensFinalizadas.length).toBe(0);
    });

    it('deve formatar dataFiltro corretamente antes da requisição', () => {
      component.dataFiltro = '15/04/2026';
      component.aplicarFiltros();
      expect(historicoServiceSpy.buscarHistorico).toHaveBeenCalledWith(
        expect.objectContaining({
          data_inicio: '2026-04-15'
        })
      );
    });
  });
});
