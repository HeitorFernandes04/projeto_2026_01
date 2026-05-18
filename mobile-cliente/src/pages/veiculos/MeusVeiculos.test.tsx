import React from 'react';
import { render, screen, act } from '@testing-library/react';
import MeusVeiculos from './MeusVeiculos';
import { getVeiculos } from '../../services/api';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, beforeEach, it, expect } from 'vitest';

// Mock da API
vi.mock('../../services/api');
const mockGetVeiculos = vi.mocked(getVeiculos);

// Mock do Ionic hook
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    useIonViewWillEnter: (cb: () => void) => {
      React.useEffect(() => {
        cb();
      }, []);
    },
  };
});

const renderComponent = () => render(
  <BrowserRouter>
    <MeusVeiculos />
  </BrowserRouter>
);

describe('MeusVeiculos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Mostra empty state quando nao ha veiculos', async () => {
    mockGetVeiculos.mockResolvedValue([]);

    renderComponent();

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Nenhum veículo cadastrado')).toBeInTheDocument();
  });

  it('Lista veiculos quando retornados pela API', async () => {
    mockGetVeiculos.mockResolvedValue([
      { id: 1, placa: 'AAA1234', marca: 'VW', modelo: 'Gol', cor: 'Preto' }
    ]);

    renderComponent();

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('VW Gol')).toBeInTheDocument();
    expect(screen.getByText('AAA1234')).toBeInTheDocument();
  });
});
