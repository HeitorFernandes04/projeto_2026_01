import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import VerificacaoOTP from './VerificacaoOTP';
import { BrowserRouter } from 'react-router-dom';

// Mock react-router-dom
const mockReplace = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useHistory: () => ({
      replace: mockReplace,
    }),
    useLocation: () => ({
      state: { telefone: '11999999999' },
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
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
  }),
}));

describe('VerificacaoOTP', () => {
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
});
