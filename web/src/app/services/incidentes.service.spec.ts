import '@angular/compiler';

import { of } from 'rxjs';

import { IncidentesService } from './incidentes.service';


describe('IncidentesService', () => {
  let service: IncidentesService;
  let mockHttpClient: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn().mockReturnValue(of([])),
    };

    service = new IncidentesService(mockHttpClient as any);
    localStorage.setItem('access_token', 'token_web_teste');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('deve consultar o endpoint de incidentes pendentes com bearer token', () => {
    service.listarPendentes().subscribe();

    expect(mockHttpClient.get).toHaveBeenCalledTimes(1);

    const [url, options] = mockHttpClient.get.mock.calls[0];
    expect(url).toBe('/api/incidentes-os/pendentes/');
    expect(options.headers.get('Authorization')).toBe('Bearer token_web_teste');
  });
});
