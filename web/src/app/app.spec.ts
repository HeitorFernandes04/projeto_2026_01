import '@angular/compiler';
import { NavigationEnd } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { App } from './app';

describe('AppComponent - Fluxo de Gestao Protegido Unificado', () => {
  let component: App;
  let mockRouter: any;
  let mockLocation: any;
  let mockAuthService: any;
  let totalPendentesSubject: BehaviorSubject<number>;
  let mockIncidentesService: any;

  function criarComponenteEm(url: string) {
    mockRouter = {
      events: of(new NavigationEnd(1, url, url)),
      navigate: vi.fn(),
    };

    mockLocation = {
      path: () => url,
    };

    totalPendentesSubject = new BehaviorSubject<number>(0);

    mockAuthService = {
      logout: vi.fn(),
      estaLogado: vi.fn(),
      obterPerfil: vi.fn().mockReturnValue(of(null)),
    };

    mockIncidentesService = {
      totalPendentes$: totalPendentesSubject.asObservable(),
      iniciarMonitoramentoPendentes: vi.fn(),
      pararMonitoramentoPendentes: vi.fn(),
    };

    component = new App(mockRouter, mockLocation, mockAuthService, mockIncidentesService);
  }

  beforeEach(() => {
    criarComponenteEm('/login');
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

  it('deve iniciar o monitoramento compartilhado em area protegida e refletir o total dinamico', () => {
    criarComponenteEm('/gestao/dashboard');
    component.ngOnInit();

    totalPendentesSubject.next(3);

    expect(mockIncidentesService.iniciarMonitoramentoPendentes).toHaveBeenCalled();
    expect(component.totalIncidentesPendentes).toBe(3);
  });

  it('deve zerar o badge e parar o monitoramento ao sair da area protegida', () => {
    criarComponenteEm('/gestao/dashboard');
    component.ngOnInit();
    totalPendentesSubject.next(2);

    const eventoLogin = new NavigationEnd(2, '/login', '/login');
    mockRouter.events = of(eventoLogin);
    component['atualizarEstadoSidebar']('/login');
    component['pararMonitoramentoIncidentes']();
    component.totalIncidentesPendentes = 0;

    expect(component.exibirSidebar).toBe(false);
    expect(mockIncidentesService.pararMonitoramentoPendentes).toHaveBeenCalled();
    expect(component.totalIncidentesPendentes).toBe(0);
  });
});
