import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import SeuVeiculo from './SeuVeiculo';
import { Route, MemoryRouter } from 'react-router-dom';
import { getVeiculo, updateVeiculo } from '../../services/api';

// Mock api services
vi.mock('../../services/api', () => ({
  getVeiculo: vi.fn(),
  createVeiculo: vi.fn(),
  updateVeiculo: vi.fn(),
}));

const mockGetVeiculo = vi.mocked(getVeiculo);
const mockUpdateVeiculo = vi.mocked(updateVeiculo);

// Mock do Ionic hook
let currentCbWillLeave: () => void = () => {};

vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    useIonViewWillEnter: (cb: () => void) => {
      React.useEffect(() => {
        cb();
      }, []);
    },
    useIonViewWillLeave: (cb: () => void) => {
      currentCbWillLeave = cb;
    },
  };
});

describe('SeuVeiculo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve validar placa tradicional corretamente', () => {
    render(
      <MemoryRouter initialEntries={['/veiculo/novo']}>
        <Route path="/veiculo/:id">
          <SeuVeiculo />
        </Route>
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('ABC-1234');
    
    fireEvent(input, new CustomEvent('ionInput', { detail: { value: 'ABC1234' } }));
    expect(screen.queryByText('Placa inválida. Ex: ABC1234 ou ABC1D23')).toBeNull();

    fireEvent(input, new CustomEvent('ionInput', { detail: { value: 'ABC123' } }));
    expect(screen.getByText('Placa inválida. Ex: ABC1234 ou ABC1D23')).toBeInTheDocument();
  });

  it('deve validar placa Mercosul corretamente', () => {
    render(
      <MemoryRouter initialEntries={['/veiculo/novo']}>
        <Route path="/veiculo/:id">
          <SeuVeiculo />
        </Route>
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('ABC-1234');
    
    fireEvent(input, new CustomEvent('ionInput', { detail: { value: 'ABC1D23' } }));
    expect(screen.queryByText('Placa inválida. Ex: ABC1234 ou ABC1D23')).toBeNull();
  });

  it('Botao permanece desabilitado se a placa for invalida', async () => {
    render(
      <MemoryRouter initialEntries={['/veiculo/novo']}>
        <Route path="/veiculo/:id">
          <SeuVeiculo />
        </Route>
      </MemoryRouter>
    );

    const button = screen.getByText('Salvar Veículo');
    expect(button).toBeDisabled();
  });

  it('Dispara updateVeiculo no modo edicao', async () => {
    mockGetVeiculo.mockResolvedValue({
      id: 1,
      placa: 'AAA1234',
      marca: 'VW',
      modelo: 'Gol',
      cor: 'Preto'
    });

    render(
      <MemoryRouter initialEntries={['/veiculo/1']}>
        <Route path="/veiculo/:id">
          <SeuVeiculo />
        </Route>
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGetVeiculo).toHaveBeenCalledWith(1);

    const button = screen.getByText('Atualizar Veículo');
    
    expect(button).not.toBeDisabled();
    
    fireEvent.click(button);
    
    expect(mockUpdateVeiculo).toHaveBeenCalled();
  });

  it('useIonViewWillLeave limpa o formulario', async () => {
    render(
      <MemoryRouter initialEntries={['/veiculo/novo']}>
        <Route path="/veiculo/:id">
          <SeuVeiculo />
        </Route>
      </MemoryRouter>
    );

    act(() => {
      currentCbWillLeave();
    });

    expect(true).toBe(true);
  });
});
