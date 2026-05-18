import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEstabelecimentos } from './api';

const mockEstabelecimentos = [
  {
    id: 1,
    nome_fantasia: 'Lava-Me Centro',
    slug: 'lava-me-centro',
    latitude: -10.184,
    longitude: -48.334,
    logo: null,
    endereco_completo: 'Av. Palmas, 100',
  },
];

describe('getEstabelecimentos', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('retorna lista de estabelecimentos quando a API responde com sucesso', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockEstabelecimentos,
    }));

    const resultado = await getEstabelecimentos();
    expect(resultado).toEqual(mockEstabelecimentos);
  });

  it('chama o endpoint correto', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    vi.stubGlobal('fetch', fetchMock);

    await getEstabelecimentos();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/publico/estabelecimentos/'),
      expect.any(Object)
    );
  });

  it('lança erro quando a API falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    await expect(getEstabelecimentos()).rejects.toThrow('Falha ao carregar estabelecimentos.');
  });
});
