import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import EstadoLavagem from './EstadoLavagem';
import React from 'react';

// Mock da API
vi.mock('../services/api', () => ({
  getAtendimento: vi.fn(),
  avancarEtapa: vi.fn(),
  registrarIncidente: vi.fn(),
}));

// Mock do router
vi.mock('react-router-dom', () => ({
  useHistory: () => ({ push: vi.fn() }),
}));

describe('EstadoLavagem', () => {
  const defaultProps = {
    atendimentoId: 1,
    onComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('deve iniciar o cronômetro e incrementar o tempo', async () => {
    const { getAtendimento } = await import('../services/api');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getAtendimento).mockResolvedValue({ status: 'em_andamento' } as any);

    render(<EstadoLavagem {...defaultProps} />);

    // Avança 5 segundos
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('00:00:05')).toBeDefined();
  });

  it('deve parar o cronômetro quando houver um incidente (OS BLOQUEADA)', async () => {
    const { getAtendimento } = await import('../services/api');
    // Simula status de incidente vindo do banco
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getAtendimento).mockResolvedValue({ status: 'INCIDENTE' } as any);

    render(<EstadoLavagem {...defaultProps} />);

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    // Deve mostrar a tela de bloqueio em vez do cronômetro
    expect(screen.getByText(/OS BLOQUEADA/i)).toBeDefined();
    // O cronômetro não deve estar visível (no código atual ele não renderiza se status for INCIDENTE)
    expect(screen.queryByText('00:00:05')).toBeNull();
  });
});
