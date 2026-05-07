import { of } from 'rxjs';

import { AuthB2CService } from './auth-b2c.service';

describe('AuthB2CService - armazenamento isolado B2C', () => {
  let service: AuthB2CService;
  let httpClient: { post: ReturnType<typeof vi.fn> };
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

    httpClient = {
      post: vi.fn(),
    };
    service = new AuthB2CService(httpClient as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve salvar login do cliente em chaves b2c sem sobrescrever token do gestor', () => {
    localStorage.setItem('access_token', 'jwt-gestor');
    localStorage.setItem('refresh_token', 'refresh-gestor');

    httpClient.post.mockReturnValueOnce(of({
      access: 'jwt-cliente',
      refresh: 'refresh-cliente',
    }));

    service.login({ telefone: '(11) 99999-0000', pin: '1234' }).subscribe();

    expect(httpClient.post).toHaveBeenCalledWith('/api/cliente/auth/token/', {
      telefone: '(11) 99999-0000',
      pin: '1234',
    });
    expect(localStorage.getItem('b2c_access_token')).toBe('jwt-cliente');
    expect(localStorage.getItem('b2c_refresh_token')).toBe('refresh-cliente');
    expect(localStorage.getItem('access_token')).toBe('jwt-gestor');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-gestor');
  });

  it('deve realizar setup inicial e salvar tokens b2c', () => {
    httpClient.post.mockReturnValueOnce(of({
      access: 'jwt-setup',
      refresh: 'refresh-setup',
    }));

    service.setup({ telefone: '11999999999', placa: 'ABC1234', pin: '4321' }).subscribe();

    expect(httpClient.post).toHaveBeenCalledWith('/api/cliente/auth/setup/', {
      telefone: '11999999999',
      placa: 'ABC1234',
      pin: '4321',
    });
    expect(localStorage.getItem('b2c_access_token')).toBe('jwt-setup');
  });

  it('deve limpar somente tokens B2C no logout do cliente', () => {
    localStorage.setItem('access_token', 'jwt-gestor');
    localStorage.setItem('refresh_token', 'refresh-gestor');
    localStorage.setItem('b2c_access_token', 'jwt-cliente');
    localStorage.setItem('b2c_refresh_token', 'refresh-cliente');

    service.logout();

    expect(localStorage.getItem('b2c_access_token')).toBeNull();
    expect(localStorage.getItem('b2c_refresh_token')).toBeNull();
    expect(localStorage.getItem('access_token')).toBe('jwt-gestor');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-gestor');
  });
});
