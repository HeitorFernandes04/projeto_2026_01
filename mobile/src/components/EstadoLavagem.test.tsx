import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import EstadoLavagem from './EstadoLavagem';
import React from 'react';

// Mock da API
vi.mock('../services/api', () => ({
  getOrdemServico: vi.fn(),
  avancarEtapa: vi.fn(),
  registrarIncidente: vi.fn(),
  pausarOrdemServico: vi.fn(),
  retomarOrdemServico: vi.fn(),
}));

// Mock do router
vi.mock('react-router-dom', () => ({
  useHistory: () => ({ push: vi.fn() }),
}));

describe('EstadoLavagem', () => {
  const defaultProps = {
    ordemServicoId: 1,
    onComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('deve iniciar o cronômetro e incrementar o tempo', async () => {
    const { getOrdemServico } = await import('../services/api');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getOrdemServico).mockResolvedValue({ status: 'EM_EXECUCAO' } as any);

    render(<EstadoLavagem {...defaultProps} />);

    // Avança 5 segundos
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('00:00:05')).toBeDefined();
  });

  it('deve parar o cronômetro quando houver um incidente (OS BLOQUEADA)', async () => {
    const { getOrdemServico } = await import('../services/api');
    // Simula status de incidente vindo do banco
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getOrdemServico).mockResolvedValue({ status: 'BLOQUEADO_INCIDENTE' } as any);

    render(<EstadoLavagem {...defaultProps} />);

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    // Deve mostrar a tela de bloqueio em vez do cronômetro
    expect(screen.getByText(/OS BLOQUEADA/i)).toBeDefined();
    // O cronômetro não deve estar visível (no código atual ele não renderiza se status for INCIDENTE)
    expect(screen.queryByText('00:00:05')).toBeNull();
  });

  it('deve iniciar o cronômetro com o tempo decorrido inicial e atualizar quando a prop mudar', async () => {
    const { getOrdemServico } = await import('../services/api');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getOrdemServico).mockResolvedValue({ status: 'EM_EXECUCAO' } as any);

    const { rerender } = render(<EstadoLavagem {...defaultProps} tempoDecorridoInicial={100} />);

    // Deve mostrar o tempo inicial 00:01:40
    expect(screen.getByText('00:01:40')).toBeDefined();

    // Avança 5 segundos
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('00:01:45')).toBeDefined();

    // Rerender com novo tempo do pai (sincronização)
    rerender(<EstadoLavagem {...defaultProps} tempoDecorridoInicial={200} />);
    expect(screen.getByText('00:03:20')).toBeDefined();
  });

  it('deve desabilitar finalizar lavagem quando pausado', async () => {
    const { getOrdemServico } = await import('../services/api');
    vi.mocked(getOrdemServico).mockResolvedValue({ status: 'EM_EXECUCAO', is_pausado: true } as any);

    await act(async () => {
      render(<EstadoLavagem {...defaultProps} isPausadoInicial={true} />);
    });

    const btnFinalizar = screen.getByRole('button', { name: /Finalizar Lavagem/i });
    expect((btnFinalizar as HTMLButtonElement).disabled).toBe(true);
  });

  it('deve chamar a API correspondente e alternar estado de pausado ao clicar no botão de pausa', async () => {
    const { getOrdemServico, pausarOrdemServico, retomarOrdemServico } = await import('../services/api');
    vi.mocked(getOrdemServico).mockResolvedValue({ status: 'EM_EXECUCAO', is_pausado: false } as any);
    vi.mocked(pausarOrdemServico).mockResolvedValue({ status: 'EM_EXECUCAO', is_pausado: true, tempo_decorrido_segundos: 10 } as any);
    vi.mocked(retomarOrdemServico).mockResolvedValue({ status: 'EM_EXECUCAO', is_pausado: false, tempo_decorrido_segundos: 10 } as any);

    render(<EstadoLavagem {...defaultProps} isPausadoInicial={false} />);

    const btnPausar = screen.getByRole('button', { name: /Pausar/i });
    
    // Clica para pausar
    await act(async () => {
      btnPausar.click();
    });

    expect(pausarOrdemServico).toHaveBeenCalledWith(1);
    expect(screen.getByText(/Retomar/i)).toBeDefined();

    // Clica para retomar
    const btnRetomar = screen.getByRole('button', { name: /Retomar/i });
    await act(async () => {
      btnRetomar.click();
    });

    expect(retomarOrdemServico).toHaveBeenCalledWith(1);
    expect(screen.getByText(/Pausar/i)).toBeDefined();
  });
});
