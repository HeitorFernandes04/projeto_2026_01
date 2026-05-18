import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import VerificacaoOTP from './VerificacaoOTP';
import { BrowserRouter } from 'react-router-dom';

// Mock react-router-dom
const mockReplace = vi.fn();
let mockLocationState = { telefone: '11999999999', redirect_to: undefined as string | undefined };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useHistory: () => ({
      replace: mockReplace,
    }),
    useLocation: () => ({
      state: mockLocationState,
    }),
  };
});

// Mock api services
vi.mock('../../services/api', () => ({
  verificarOTP: vi.fn(),
  solicitarOTP: vi.fn(),
  getVeiculos: vi.fn(),
}));

// Mock AuthContext
const mockLogin = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

describe('VerificacaoOTP', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationState.redirect_to = undefined;
  });

  it('deve avancar o foco automaticamente ao digitar', () => {
    render(
      <BrowserRouter>
        <VerificacaoOTP />
      </BrowserRouter>
    );

    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(4);

    // Simula digitação no primeiro input
    fireEvent.change(inputs[0], { target: { value: '1' } });
    expect(document.activeElement).toBe(inputs[1]);

    // Simula digitação no segundo input
    fireEvent.change(inputs[1], { target: { value: '2' } });
    expect(document.activeElement).toBe(inputs[2]);
  });

  it('deve retroceder o foco ao apertar Backspace em campo vazio', () => {
    render(
      <BrowserRouter>
        <VerificacaoOTP />
      </BrowserRouter>
    );

    const inputs = screen.getAllByRole('textbox');
    
    // Foca no segundo input
    inputs[1].focus();
    expect(document.activeElement).toBe(inputs[1]);
    
    // Simula backspace
    fireEvent.keyDown(inputs[1], { key: 'Backspace' });
    expect(document.activeElement).toBe(inputs[0]);
  });

  it('deve redirecionar para /perfil se redirect_to estiver no estado apos sucesso', async () => {
    mockLocationState.redirect_to = '/perfil';
    
    const { verificarOTP } = await import('../../services/api');
    vi.mocked(verificarOTP).mockResolvedValueOnce({
      access: 'access',
      refresh: 'refresh',
      usuario: { id: 1, nome: 'Teste', telefone: '11999999999', membro_desde: '2026-05-18' }
    });

    render(
      <BrowserRouter>
        <VerificacaoOTP />
      </BrowserRouter>
    );

    const inputs = screen.getAllByRole('textbox');
    
    // Digita o PIN 1234
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '2' } });
    fireEvent.change(inputs[2], { target: { value: '3' } });
    fireEvent.change(inputs[3], { target: { value: '4' } });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/perfil');
    });
  });
});
