import '@angular/compiler';

import { of } from 'rxjs';

import { IncidentesService } from './incidentes.service';


describe('IncidentesService', () => {
  let service: IncidentesService;
  let mockHttpClient: {
    get: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };
  let localStorageMock: {
    getItem: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn().mockReturnValue(of([])),
      patch: vi.fn().mockReturnValue(of({})),
    };

    localStorageMock = {
      getItem: vi.fn().mockReturnValue('token_web_teste'),
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      configurable: true,
    });

    service = new IncidentesService(mockHttpClient as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve consultar o endpoint de incidentes pendentes com bearer token', () => {
    service.listarPendentes().subscribe();

    const [url, options] = mockHttpClient.get.mock.calls[0];
    expect(url).toBe('/api/incidentes-os/pendentes/');
    expect(options.headers.get('Authorization')).toBe('Bearer token_web_teste');
  });

  it('deve consultar o endpoint de auditoria do incidente', () => {
    service.obterAuditoria(11).subscribe();

    const [url, options] = mockHttpClient.get.mock.calls[0];
    expect(url).toBe('/api/incidentes-os/11/auditoria/');
    expect(options.headers.get('Authorization')).toBe('Bearer token_web_teste');
  });

  it('deve enviar a nota de resolucao para o endpoint de desbloqueio', () => {
    service.resolverIncidente(11, 'Conferido e liberado.').subscribe();

    const [url, body, options] = mockHttpClient.patch.mock.calls[0];
    expect(url).toBe('/api/incidentes-os/11/resolver/');
    expect(body).toEqual({ observacoes_resolucao: 'Conferido e liberado.' });
    expect(options.headers.get('Authorization')).toBe('Bearer token_web_teste');
  });
});
