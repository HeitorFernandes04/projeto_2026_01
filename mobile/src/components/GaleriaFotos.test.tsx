import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import GaleriaFotos from './GaleriaFotos';
import React from 'react';

// Mock do @capacitor/camera — DataUrl (novo padrão após refatoração)
vi.mock('@capacitor/camera', () => ({
  Camera: {
    getPhoto: vi.fn(),
  },
  CameraResultType: { DataUrl: 'dataUrl' },
  CameraSource: { Camera: 'camera' },
}));

// Mock do api service
vi.mock('../services/api', () => ({
  uploadFotos: vi.fn().mockResolvedValue({ success: true }),
}));

describe('GaleriaFotos', () => {
  const defaultProps = {
    atendimentoId: 1,
    momento: 'VISTORIA_GERAL' as const,
    fotosIniciais: [],
    onUploadSuccess: vi.fn(),
  };

  it('deve renderizar exatamente 5 slots de foto', () => {
    render(<GaleriaFotos {...defaultProps} />);
    // Com 0 fotos e 5 slots, todos são botões de "Adicionar foto N"
    const slotsVazios = screen.getAllByTitle(/Adicionar foto/i);
    expect(slotsVazios).toHaveLength(5);
  });

  it('deve adicionar foto ao staging local sem fazer upload imediato', async () => {
    const { Camera } = await import('@capacitor/camera');
    vi.mocked(Camera.getPhoto).mockResolvedValue({
      dataUrl: 'data:image/jpeg;base64,dGVzdA==',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Mock do global fetch para converter o dataUrl em Blob
    global.fetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob(['test'], { type: 'image/jpeg' })),
    });

    render(<GaleriaFotos {...defaultProps} />);
    
    // Clica no primeiro slot vazio
    const primeroSlot = screen.getAllByTitle(/Adicionar foto/i)[0];
    fireEvent.click(primeroSlot);

    await waitFor(() => {
      // Verifica se a imagem de preview apareceu no slot 1
      expect(screen.getByAltText(/Foto 1/i)).toBeDefined();
    });

    // Verifica se o botão de confirmar apareceu (staging)
    expect(screen.getByText(/Confirmar 1 foto\(s\)/i)).toBeDefined();
  });

  it('deve permitir remover uma foto do staging com botão X', async () => {
    const { Camera } = await import('@capacitor/camera');
    vi.mocked(Camera.getPhoto).mockResolvedValue({
      dataUrl: 'data:image/jpeg;base64,dGVzdA==',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(new Blob()) });

    render(<GaleriaFotos {...defaultProps} />);
    
    // Adiciona foto clicando no slot vazio
    const primeroSlot = screen.getAllByTitle(/Adicionar foto/i)[0];
    fireEvent.click(primeroSlot);

    // Aguarda a foto aparecer
    await waitFor(() => screen.getByAltText(/Foto 1/i));

    // Remove a foto via botão X (title "Remover foto")
    const btnRemover = screen.getByTitle(/Remover foto/i);
    fireEvent.click(btnRemover);

    // Foto deve desaparecer e slot voltar a ser vazio
    expect(screen.queryByAltText(/Foto 1/i)).toBeNull();
    // Os 5 slots voltam a ser botões de adicionar
    expect(screen.getAllByTitle(/Adicionar foto/i)).toHaveLength(5);
  });
});
