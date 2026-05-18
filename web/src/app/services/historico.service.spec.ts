import '@angular/compiler';

import { of } from 'rxjs';

import { HistoricoService } from './historico.service';

describe('HistoricoService - RF-31', () => {
  let service: HistoricoService;
  let mockHttpClient: { get: ReturnType<typeof vi.fn> };
  let localStorageMock: { getItem: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn().mockReturnValue(of({
        data: [{ id: 1, placa: 'ABC-1234' }],
        meta: { count: 1, next: null, previous: null, perfil: 'GESTOR' },
        errors: [],
      })),
    };
    localStorageMock = {
      getItem: vi.fn().mockReturnValue('token_web_teste'),
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      configurable: true,
    });

    service = new HistoricoService(mockHttpClient as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve consultar historico unificado em /api/shared/historico/', () => {
    service.buscarHistorico({ placa: 'ABC', page: 2 }).subscribe();

    const [url, options] = mockHttpClient.get.mock.calls[0];
    expect(url).toBe('/api/shared/historico/');
    expect(options.params.get('placa')).toBe('ABC');
    expect(options.params.get('page')).toBe('2');
    expect(options.headers.get('Authorization')).toBe('Bearer token_web_teste');
  });

  it('deve adaptar envelope unificado para o formato paginado da tela', async () => {
    let resultado: any;

    service.buscarHistorico().subscribe((res) => (resultado = res));

    expect(resultado.count).toBe(1);
    expect(resultado.next).toBeNull();
    expect(resultado.previous).toBeNull();
    expect(resultado.results).toEqual([{ id: 1, placa: 'ABC-1234' }]);
  });

  it('deve buscar galeria pelo endpoint compartilhado', () => {
    mockHttpClient.get.mockReturnValueOnce(of({
      data: { entrada: [], finalizacao: [], laudo_tecnico: {} },
      meta: {},
      errors: [],
    }));

    service.buscarGaleria(42).subscribe();

    const [url] = mockHttpClient.get.mock.calls[0];
    expect(url).toBe('/api/shared/historico/42/galeria/');
  });
});
