import '@angular/compiler';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { of } from 'rxjs';

import { App } from './app';

describe('AppComponent - Fluxo de Gestão Protegido Unificado', () => {
  let component: App;
  let mockRouter: any;
  let mockLocation: any;

  beforeEach(() => {
    mockRouter = {
      events: of(new NavigationEnd(1, '/login', '/login')),
      navigate: vi.fn()
    };
    
    mockLocation = {
      path: () => '/login'
    };

    // Criar componente manualmente sem TestBed
    component = new App(mockRouter, mockLocation);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve ter método logout() funcional', () => {
    expect(typeof component.logout).toBe('function');
  });

  it('deve ter método irParaIncidentes() funcional', () => {
    expect(typeof component.irParaIncidentes).toBe('function');
  });

  it('deve ter propriedades iniciais corretas', () => {
    expect(component.title).toBe('Gestor');
    expect(component.exibirSidebar).toBe(false); // Componente inicia com sidebar oculta
  });
});
