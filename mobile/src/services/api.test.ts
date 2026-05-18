import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { getHistoricoOrdemServico } from './api';

describe('services/api - RF-31', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [{ id: 7, status: 'FINALIZADO' }],
        meta: { perfil: 'FUNCIONARIO', count: 1 },
        errors: [],
      }),
    });

    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue('token_mobile_teste'),
        removeItem: vi.fn(),
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('deve consultar o historico operacional pelo endpoint unificado', async () => {
    const resultado = await getHistoricoOrdemServico('2026-05-01', '2026-05-14');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/shared/historico/?data_inicial=2026-05-01&data_final=2026-05-14',
      expect.objectContaining({
        cache: 'no-store',
        headers: expect.objectContaining({
          Authorization: 'Bearer token_mobile_teste',
        }),
      }),
    );
    expect(resultado).toEqual([{ id: 7, status: 'FINALIZADO' }]);
  });
});
