import React from 'react';
import { render, screen, act } from '@testing-library/react';
import Acompanhamento from './Acompanhamento';
import { getOrdemAtiva, getAcompanhamento } from '../../services/api';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';

// Mock da API
vi.mock('../../services/api');
const mockGetOrdemAtiva = vi.mocked(getOrdemAtiva);
const mockGetAcompanhamento = vi.mocked(getAcompanhamento);

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

const renderComponent = () => render(
  <BrowserRouter>
    <Acompanhamento />
  </BrowserRouter>
);

describe('Acompanhamento', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Teste 1 (Ciclo de Vida do Polling): Inicia polling e limpa no leave', async () => {
    mockGetOrdemAtiva.mockResolvedValue({
      id: 1,
      status: 'EM_EXECUCAO',
      progresso: 50,
      estabelecimento_nome: 'Lava Rápido',
      tempo_estimado_min: 15,
      data_hora: '2026-05-18T10:00:00',
    } as any);

    mockGetAcompanhamento.mockResolvedValue({
      etapa_atual: 60,
      status: 'EM_EXECUCAO',
    } as any);

    renderComponent();

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGetOrdemAtiva).toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(15000);
    });

    expect(mockGetAcompanhamento).toHaveBeenCalledWith(1);

    act(() => {
      currentCbWillLeave();
    });

    act(() => {
      vi.advanceTimersByTime(15000);
    });

    expect(mockGetAcompanhamento).toHaveBeenCalledTimes(2); // 1 do init + 1 do timer
  });

  it('Teste 2 (Trava de Agendamento Futuro): PATIO com data futura mostra card de reserva', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    mockGetOrdemAtiva.mockResolvedValue({
      id: 1,
      status: 'PATIO',
      progresso: 0,
      estabelecimento_nome: 'Lava Rápido Premium',
      servico_nome: 'Lavagem Completa',
      data_hora: `${tomorrowStr}T14:00:00`,
    } as any);

    renderComponent();

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('AGENDAMENTO RESERVADO')).toBeInTheDocument();
    expect(screen.getByText('Lava Rápido Premium')).toBeInTheDocument();
    expect(screen.getByText('Lavagem Completa')).toBeInTheDocument();
    expect(screen.getByText('O monitoramento da esteira em tempo real será ativado automaticamente assim que o veículo der entrada no pátio do estabelecimento na data agendada.')).toBeInTheDocument();

    // Não deve iniciar polling
    act(() => {
      vi.advanceTimersByTime(15000);
    });

    expect(mockGetAcompanhamento).not.toHaveBeenCalled();
  });

  it('Teste 3 (Status Terminal Finalizado): Para polling e bate 100%', async () => {
    mockGetOrdemAtiva.mockResolvedValue({
      id: 1,
      status: 'EM_EXECUCAO',
      progresso: 50,
      estabelecimento_nome: 'Lava Rápido',
      data_hora: '2026-05-18T10:00:00',
    } as any);

    mockGetAcompanhamento.mockResolvedValue({
      etapa_atual: 100,
      status: 'FINALIZADO',
    } as any);

    renderComponent();

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      vi.advanceTimersByTime(15000);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Seu veículo está pronto!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(15000);
    });

    expect(mockGetAcompanhamento).toHaveBeenCalledTimes(1);
  });

  it('Teste 4 (Resiliência de Rede): Falha no polling não quebra o app', async () => {
    mockGetOrdemAtiva.mockResolvedValue({
      id: 1,
      status: 'EM_EXECUCAO',
      progresso: 50,
      estabelecimento_nome: 'Lava Rápido',
      data_hora: '2026-05-18T10:00:00',
    } as any);

    mockGetAcompanhamento.mockRejectedValue(new Error('Network error'));

    renderComponent();

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('50%')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(15000);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('Teste 5 (Sem OS): Mostra radar e botao de agendar', async () => {
    mockGetOrdemAtiva.mockResolvedValue(null);

    renderComponent();

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Nenhum veículo na esteira')).toBeInTheDocument();
    expect(screen.getByText('Agendar Nova Lavagem')).toBeInTheDocument();
  });
});
