import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';

import { authInterceptor } from './auth.interceptor';

describe('authInterceptor - tokens portal-aware', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
        clear: vi.fn(() => {
          store = {};
        }),
      },
      configurable: true,
    });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('deve anexar b2c_access_token em requisicoes do portal do cliente', () => {
    localStorage.setItem('access_token', 'jwt-gestor');
    localStorage.setItem('b2c_access_token', 'jwt-cliente');

    http.get('/api/cliente/painel/').subscribe();

    const req = httpMock.expectOne('/api/cliente/painel/');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-cliente');
    req.flush({});
  });

  it('deve manter access_token original em rotas protegidas de gestao', () => {
    localStorage.setItem('access_token', 'jwt-gestor');
    localStorage.setItem('b2c_access_token', 'jwt-cliente');

    http.get('/api/gestao/dashboard/').subscribe();

    const req = httpMock.expectOne('/api/gestao/dashboard/');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-gestor');
    req.flush({});
  });

  it('nao deve anexar Authorization em rotas publicas', () => {
    localStorage.setItem('access_token', 'jwt-gestor');
    localStorage.setItem('b2c_access_token', 'jwt-cliente');

    http.post('/api/publico/auth/login/', {}).subscribe();

    const req = httpMock.expectOne('/api/publico/auth/login/');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
