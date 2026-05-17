import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Home from './Home';
import type { EstabelecimentoMapa } from '../../services/api';

// Mock do react-leaflet para não precisar de DOM real com mapa
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mapa">{children}</div>
  ),
  TileLayer: () => null,
  Marker: ({ eventHandlers, children }: {
    position: [number, number];
    eventHandlers?: { click?: () => void };
    children?: React.ReactNode;
  }) => (
    <div
      data-testid="marker"
      onClick={() => eventHandlers?.click?.()}
    >
      {children}
    </div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@ionic/react', () => ({
  IonPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonFab: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonFabButton: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  IonIcon: () => null,
  IonSearchbar: ({ value, onIonInput, placeholder }: {
    value: string;
    onIonInput: (e: CustomEvent) => void;
    placeholder?: string;
  }) => (
    <input
      data-testid="searchbar"
      value={value}
      placeholder={placeholder}
      onChange={e => onIonInput({ detail: { value: e.target.value } } as unknown as CustomEvent)}
    />
  ),
  IonChip: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button data-testid="chip" onClick={onClick}>{children}</button>
  ),
  IonLabel: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  useIonViewWillEnter: (fn: () => void) => { fn(); },
}));

vi.mock('../../components/EstabelecimentoDrawer/EstabelecimentoDrawer', () => ({
  default: ({ estabelecimento, onClose }: {
    estabelecimento: EstabelecimentoMapa | null;
    posicaoUsuario: [number, number] | null;
    onClose: () => void;
  }) => estabelecimento ? (
    <div data-testid="drawer">
      <span>{estabelecimento.nome_fantasia}</span>
      <button onClick={onClose}>Fechar</button>
    </div>
  ) : null,
}));

const mockAtivo: EstabelecimentoMapa = {
  id: 1,
  nome_fantasia: 'Lava-Me Centro',
  slug: 'lava-me-centro',
  latitude: -10.184,
  longitude: -48.334,
  logo: null,
  endereco_completo: 'Av. Palmas, 100',
};

const mockSemGeolocalizacao: EstabelecimentoMapa = {
  id: 2,
  nome_fantasia: 'Lava-Me Sem Coords',
  slug: 'lava-me-sem-coords',
  latitude: null,
  longitude: null,
  logo: null,
  endereco_completo: 'Rua X, 0',
};

describe('Home', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza o mapa', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }));

    render(<Home />);
    expect(screen.getByTestId('mapa')).toBeDefined();
  });

  it('renderiza pins apenas para estabelecimentos com lat/long (RF-28.3)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [mockAtivo, mockSemGeolocalizacao],
    }));

    render(<Home />);
    await waitFor(() => {
      const markers = screen.getAllByTestId('marker');
      expect(markers).toHaveLength(1);
    });
  });

  it('abre o Drawer ao clicar num pin (RF-28.4)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [mockAtivo],
    }));

    render(<Home />);
    await waitFor(() => screen.getByTestId('marker'));
    fireEvent.click(screen.getByTestId('marker'));
    expect(screen.getByTestId('drawer')).toBeDefined();
    expect(screen.getByText('Lava-Me Centro')).toBeDefined();
  });

  it('fecha o Drawer ao chamar onClose', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [mockAtivo],
    }));

    render(<Home />);
    await waitFor(() => screen.getByTestId('marker'));
    fireEvent.click(screen.getByTestId('marker'));
    fireEvent.click(screen.getByText('Fechar'));
    expect(screen.queryByTestId('drawer')).toBeNull();
  });

  it('não crasha quando fetch falha — mapa continua visível', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    render(<Home />);
    await waitFor(() => {});
    expect(screen.getByTestId('mapa')).toBeDefined();
  });

  it('barra de busca filtra pins pelo nome', async () => {
    const mockSegundo: EstabelecimentoMapa = {
      id: 3,
      nome_fantasia: 'Brilha Car',
      slug: 'brilha-car',
      latitude: -10.190,
      longitude: -48.340,
      logo: null,
      endereco_completo: 'Rua Y, 200',
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [mockAtivo, mockSegundo],
    }));

    render(<Home />);
    await waitFor(() => {
      expect(screen.getAllByTestId('marker')).toHaveLength(2);
    });

    fireEvent.change(screen.getByTestId('searchbar'), { target: { value: 'Brilha' } });

    await waitFor(() => {
      expect(screen.getAllByTestId('marker')).toHaveLength(1);
    });
  });

  it('exibe chips de filtro (RF-29)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }));

    render(<Home />);
    const chips = screen.getAllByTestId('chip');
    expect(chips.length).toBeGreaterThanOrEqual(3);
  });

  it('exibe badge contador de resultados', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [mockAtivo],
    }));

    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText(/1 encontrado/)).toBeDefined();
    });
  });
});
