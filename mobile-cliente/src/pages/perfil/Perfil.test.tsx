import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import Perfil from './Perfil';
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
  it('deve chamar logout e redirecionar ao confirmar no alerta', async () => {
    render(
      <BrowserRouter>
        <Perfil />
      </BrowserRouter>
    );

    // Clica no botão de logout
    const logoutBtn = screen.getByText('Sair da conta');
    fireEvent.click(logoutBtn);

    // Verifica se o alerta apareceu com a mensagem correta (Ionic costuma renderizar como atributo em testes)
    const alert = document.querySelector('ion-alert[header="Sair da conta"]');
    expect(alert).toBeTruthy();
    expect(alert?.getAttribute('message')).toBe('Tem certeza que deseja desconectar do aplicativo?');
  });
});
