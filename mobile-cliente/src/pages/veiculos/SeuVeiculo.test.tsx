import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import SeuVeiculo from './SeuVeiculo';
import { BrowserRouter } from 'react-router-dom';

// Mock react-router-dom
const mockGoBack = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'novo' }),
    useHistory: () => ({
      goBack: mockGoBack,
    }),
  };
});

// Mock api services
vi.mock('../../services/api', () => ({
  getVeiculo: vi.fn(),
  createVeiculo: vi.fn(),
  updateVeiculo: vi.fn(),
}));

describe('SeuVeiculo', () => {
  it('deve validar placa tradicional corretamente', () => {
    render(
      <BrowserRouter>
        <SeuVeiculo />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText('ABC-1234');
    
    // Simula evento ionInput do Ionic
    fireEvent(input, new CustomEvent('ionInput', { detail: { value: 'ABC1234' } }));
    expect(screen.queryByText('Placa inválida. Ex: ABC1234 ou ABC1D23')).toBeNull();

    // Placa inválida
    fireEvent(input, new CustomEvent('ionInput', { detail: { value: 'ABC123' } }));
    expect(screen.getByText('Placa inválida. Ex: ABC1234 ou ABC1D23')).toBeInTheDocument();
  });

  it('deve validar placa Mercosul corretamente', () => {
    render(
      <BrowserRouter>
        <SeuVeiculo />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText('ABC-1234');
    
    // Placa válida Mercosul
    fireEvent(input, new CustomEvent('ionInput', { detail: { value: 'ABC1D23' } }));
    expect(screen.queryByText('Placa inválida. Ex: ABC1234 ou ABC1D23')).toBeNull();
  });
});
