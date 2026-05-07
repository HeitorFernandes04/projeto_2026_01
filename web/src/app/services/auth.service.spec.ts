import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { vi } from 'vitest';

describe('AuthService - Gestão B2B', () => {
  let service: AuthService;
  let httpClient: { post: any, get: any };
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    
    // Mock localStorage
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
      get: vi.fn(),
    };
    
    service = new AuthService(httpClient as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve realizar login e salvar access_token no localStorage', () => {
    const mockCredentials = { email: 'admin@lava.me', password: '123' };
    const mockResponse = { access: 'jwt-token-123' };
    httpClient.post.mockReturnValue(of(mockResponse));

    service.login(mockCredentials).subscribe();

    expect(httpClient.post).toHaveBeenCalledWith('/api/auth/login/', mockCredentials);
    expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'jwt-token-123');
  });

  it('deve obter perfil enviando token correto no header', () => {
    store['access_token'] = 'jwt-valid-token';
    const mockPerfil = { id: 1, name: 'Admin' };
    httpClient.get.mockReturnValue(of(mockPerfil));

    service.obterPerfil().subscribe();

    expect(httpClient.get).toHaveBeenCalledWith('/api/auth/meu_perfil/', expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer jwt-valid-token'
      })
    }));
  });

  it('recarregarPerfil deve disparar nova chamada de obterPerfil', () => {
    store['access_token'] = 'token';
    httpClient.get.mockReturnValue(of({}));
    
    service.recarregarPerfil();

    expect(httpClient.get).toHaveBeenCalled();
  });
});
