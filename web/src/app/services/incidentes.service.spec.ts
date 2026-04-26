import '@angular/compiler';

import { firstValueFrom, of } from 'rxjs';

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
    vi.useFakeTimers();

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
    service.pararMonitoramentoPendentes();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('deve consultar o endpoint de incidentes pendentes com bearer token', () => {
    service.listarPendentes().subscribe();

    const [url, options] = mockHttpClient.get.mock.calls[0];
    expect(url).toBe('/api/incidentes-os/pendentes/');
    expect(options.headers.get('Authorization')).toBe('Bearer token_web_teste');
  });

  it('deve atualizar a fonte reativa ao recarregar os pendentes', async () => {
    mockHttpClient.get.mockReturnValueOnce(of([{ id: 1 }, { id: 2 }] as any));

    const valores: number[] = [];
    const subscription = service.totalPendentes$.subscribe((total) => valores.push(total));

    await firstValueFrom(service.recarregarPendentes());

    expect(service.snapshotPendentes().length).toBe(2);
    expect(valores.at(-1)).toBe(2);
    subscription.unsubscribe();
  });

  it('deve iniciar apenas um polling compartilhado mesmo com chamadas repetidas', () => {
    mockHttpClient.get.mockReturnValue(of([{ id: 1 }] as any));

    service.iniciarMonitoramentoPendentes(1000);
    service.iniciarMonitoramentoPendentes(1000);
    vi.advanceTimersByTime(2100);

    expect(mockHttpClient.get).toHaveBeenCalledTimes(3);
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
