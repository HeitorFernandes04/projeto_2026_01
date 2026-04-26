import '@angular/compiler';
import { NavigationEnd } from '@angular/router';
import { of, throwError } from 'rxjs';

import { App } from './app';

describe('AppComponent - Fluxo de Gestao Protegido Unificado', () => {
  let component: App;
  let mockRouter: any;
  let mockLocation: any;
  let mockAuthService: any;
  let mockIncidentesService: any;

  beforeEach(() => {
    mockRouter = {
      events: of(new NavigationEnd(1, '/login', '/login')),
      navigate: vi.fn(),
    };

    mockLocation = {
      path: () => '/login',
    };

    mockAuthService = {
      logout: vi.fn(),
      estaLogado: vi.fn(),
      obterPerfil: vi.fn().mockReturnValue(of(null)),
    };

    mockIncidentesService = {
      listarPendentes: vi.fn().mockReturnValue(of([])),
    };

    component = new App(mockRouter, mockLocation, mockAuthService, mockIncidentesService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve ter metodo logout() funcional', () => {
    expect(typeof component.logout).toBe('function');
  });

  it('deve ter metodo irParaIncidentes() funcional', () => {
    expect(typeof component.irParaIncidentes).toBe('function');
  });

  it('deve ter propriedades iniciais corretas', () => {
    expect(component.title).toBe('Gestor');
    expect(component.exibirSidebar).toBe(false);
    expect(component.totalIncidentesPendentes).toBe(0);
  });

  it('deve carregar o total dinamico de incidentes pendentes em area protegida', () => {
    mockRouter = {
      events: of(new NavigationEnd(1, '/gestao/dashboard', '/gestao/dashboard')),
      navigate: vi.fn(),
    };

    mockLocation = {
      path: () => '/gestao/dashboard',
    };

    mockIncidentesService = {
      listarPendentes: vi.fn().mockReturnValue(of([{ id: 1 }, { id: 2 }, { id: 3 }])),
    };

    component = new App(mockRouter, mockLocation, mockAuthService, mockIncidentesService);
    component.ngOnInit();

    expect(mockIncidentesService.listarPendentes).toHaveBeenCalled();
    expect(component.totalIncidentesPendentes).toBe(3);
  });

  it('deve manter o badge em zero quando a consulta de incidentes falhar', () => {
    mockRouter = {
      events: of(new NavigationEnd(1, '/gestao/dashboard', '/gestao/dashboard')),
      navigate: vi.fn(),
    };

    mockLocation = {
      path: () => '/gestao/dashboard',
    };

    mockIncidentesService = {
      listarPendentes: vi.fn().mockReturnValue(throwError(() => new Error('falha api'))),
    };

    component = new App(mockRouter, mockLocation, mockAuthService, mockIncidentesService);
    component.ngOnInit();

    expect(component.totalIncidentesPendentes).toBe(0);
  });
});
