import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import Perfil from './Perfil';
import { BrowserRouter } from 'react-router-dom';

// Mock react-router-dom
const mockReplace = vi.fn();
const mockPush = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useHistory: () => ({
      replace: mockReplace,
      push: mockPush,
    }),
  };
});

// Mock api services
vi.mock('../../services/api', () => ({
  getPerfil: vi.fn().mockResolvedValue({ nome: 'Teste User', telefone: '11999999999' }),
  updatePerfil: vi.fn(),
}));

// Mock AuthContext
const mockLogout = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { nome: 'Teste User', telefone: '11999999999' },
    logout: mockLogout,
  }),
}));

describe('Perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve chamar logout e redirecionar ao confirmar no alerta', async () => {
    render(
      <BrowserRouter>
        <Perfil />
      </BrowserRouter>
    );

    const logoutBtn = screen.getByText('Sair da conta');
    fireEvent.click(logoutBtn);

    const alert = document.querySelector('ion-alert[header="Sair da conta"]');
    expect(alert).toBeTruthy();
    expect(alert?.getAttribute('message')).toBe('Tem certeza que deseja desconectar do aplicativo?');
  });

  it('deve abrir o alerta de edicao de nome ao clicar no card de nome', async () => {
    render(
      <BrowserRouter>
        <Perfil />
      </BrowserRouter>
    );

    const nomeBtn = screen.getByText('Nome').closest('.perfil-item-card');
    fireEvent.click(nomeBtn!);

    const alert = document.querySelector('ion-alert[header="Atualizar Nome"]');
    expect(alert).toBeTruthy();
  });

  it('deve navegar para /auth/whatsapp com state de redirect_to ao clicar no card de whatsapp', async () => {
    render(
      <BrowserRouter>
        <Perfil />
      </BrowserRouter>
    );

    const whatsappBtn = screen.getByText('WhatsApp').closest('.perfil-item-card');
    fireEvent.click(whatsappBtn!);

    expect(mockPush).toHaveBeenCalledWith('/auth/whatsapp', { redirect_to: '/perfil', nome: 'Teste User' });
  });
});
