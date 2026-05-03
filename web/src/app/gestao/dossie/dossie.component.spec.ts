import { Router, ActivatedRoute } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import '@angular/compiler';

import { DossieComponent } from './dossie.component';
import { HistoricoService, GaleriaOS } from '../../services/historico.service';
import { of, throwError } from 'rxjs';

const mockGaleria: GaleriaOS = {
  estado_inicial: [
    { id: 1, arquivo_url: 'http://api/fotos/1.jpg', momento: 'ENTRADA' },
    { id: 2, arquivo_url: 'http://api/fotos/2.jpg', momento: 'AVARIA_PREVIA' },
  ],
  estado_meio: [],
  estado_final: [
    { id: 3, arquivo_url: 'http://api/fotos/3.jpg', momento: 'FINALIZADO' },
  ],
};

describe('DossieComponent — RF-18', () => {
  let component: DossieComponent;
  let routerSpy: any;
  let routeSpy: any;
  let serviceSpy: any;
  let cdrSpy: any;

  beforeEach(() => {
    routerSpy  = { navigate: vi.fn() };
    cdrSpy     = { markForCheck: vi.fn() };
    routeSpy   = { snapshot: { paramMap: { get: vi.fn().mockReturnValue('42') } } };
    serviceSpy = { buscarGaleria: vi.fn().mockReturnValue(of(mockGaleria)) };

    component = new DossieComponent(
      routeSpy as ActivatedRoute,
      routerSpy as Router,
      serviceSpy as HistoricoService,
      cdrSpy as ChangeDetectorRef,
    );
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Inicialização', () => {
    it('deve extrair o osId da rota ao chamar ngOnInit', () => {
      component.ngOnInit();
      expect(component.osId).toBe(42);
    });

    it('deve chamar buscarGaleria com o id correto', () => {
      component.ngOnInit();
      expect(serviceSpy.buscarGaleria).toHaveBeenCalledWith(42);
    });

    it('deve preencher galeria com dados da API', () => {
      component.ngOnInit();
      expect(component.galeria.estado_inicial.length).toBe(2);
      expect(component.galeria.estado_final.length).toBe(1);
      expect(component.carregando).toBe(false);
    });
  });

  describe('Tratamento de Erro', () => {
    it('deve ativar flag de erro quando a API falha', () => {
      serviceSpy.buscarGaleria.mockReturnValue(throwError(() => new Error('403')));
      component.ngOnInit();
      expect(component.erro).toBe(true);
      expect(component.carregando).toBe(false);
    });
  });

  describe('Lightbox', () => {
    it('deve abrir a foto ao chamar ampliarFoto()', () => {
      component.ampliarFoto('http://api/fotos/1.jpg');
      expect(component.fotoAmpliada).toBe('http://api/fotos/1.jpg');
    });

    it('deve fechar a foto ao chamar fecharFoto()', () => {
      component.ampliarFoto('http://api/fotos/1.jpg');
      component.fecharFoto();
      expect(component.fotoAmpliada).toBeNull();
    });
  });

  describe('totalFotos()', () => {
    it('deve somar todas as fotos das três seções', () => {
      component.ngOnInit();
      expect(component.totalFotos(component.galeria)).toBe(3);
    });

    it('deve retornar 0 quando todas as seções estão vazias', () => {
      const vazia: GaleriaOS = { estado_inicial: [], estado_meio: [], estado_final: [] };
      expect(component.totalFotos(vazia)).toBe(0);
    });
  });

  describe('Navegação', () => {
    it('deve navegar para /gestao/historico ao chamar voltar()', () => {
      component.voltar();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/gestao/historico']);
    });

    it('deve navegar para /gestao/incidentes ao chamar irParaIncidentes()', () => {
      component.irParaIncidentes();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/gestao/incidentes']);
    });
  });
});
