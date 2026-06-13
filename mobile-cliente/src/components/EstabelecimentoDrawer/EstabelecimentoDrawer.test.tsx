import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EstabelecimentoDrawer from './EstabelecimentoDrawer';
import type { EstabelecimentoMapa } from '../../services/api';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ token: null }),
}));

vi.mock('react-router-dom', () => ({
  useHistory: () => ({ push: vi.fn() }),
}));

vi.mock('@ionic/react', () => ({
  IonModal: ({ isOpen, onDidDismiss, children }: {
    isOpen: boolean;
    onDidDismiss: () => void;
    children: React.ReactNode;
  }) => isOpen ? (
    <div data-testid="modal" onClick={onDidDismiss}>{children}</div>
  ) : null,
  IonContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonButton: ({ children, onClick, routerLink }: {
    children: React.ReactNode;
    onClick?: () => void;
    routerLink?: string;
  }) => <button onClick={onClick} data-href={routerLink}>{children}</button>,
  IonChip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  IonLabel: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  IonIcon: () => null,
}));

const estabelecimentoMock: EstabelecimentoMapa = {
  id: 1,
  nome_fantasia: 'Lava-Me Centro',
  slug: 'lava-me-centro',
  latitude: -10.184,
  longitude: -48.334,
  logo: null,
  endereco_completo: 'Av. Palmas, 100',
};

describe('EstabelecimentoDrawer', () => {
  it('não renderiza quando estabelecimento é null', () => {
    render(
      <EstabelecimentoDrawer
        estabelecimento={null}
        posicaoUsuario={null}
        onClose={vi.fn()}
      />,
    );
    expect(document.querySelector('.floating-card-wrapper')).toBeNull();
  });

  it('renderiza o modal quando um estabelecimento é selecionado', () => {
    render(
      <EstabelecimentoDrawer
        estabelecimento={estabelecimentoMock}
        posicaoUsuario={null}
        onClose={vi.fn()}
      />,
    );
    expect(document.querySelector('.floating-card-wrapper')).not.toBeNull();
    expect(screen.getByText('Lava-Me Centro')).toBeDefined();
    expect(screen.getByText('Av. Palmas, 100')).toBeDefined();
  });

  it('chama onClose ao dispensar o modal', () => {
    const onClose = vi.fn();
    render(
      <EstabelecimentoDrawer
        estabelecimento={estabelecimentoMock}
        posicaoUsuario={null}
        onClose={onClose}
      />,
    );
    const closeBtn = document.querySelector('.floating-close-btn');
    if (closeBtn) fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('botão "Ver Serviços" está presente (RF-29)', () => {
    render(
      <EstabelecimentoDrawer
        estabelecimento={estabelecimentoMock}
        posicaoUsuario={null}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/ver serviços/i)).toBeDefined();
  });

  it('não quebra quando logo é null', () => {
    render(
      <EstabelecimentoDrawer
        estabelecimento={{ ...estabelecimentoMock, logo: null }}
        posicaoUsuario={null}
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('exibe a logo quando fornecida', () => {
    render(
      <EstabelecimentoDrawer
        estabelecimento={{ ...estabelecimentoMock, logo: 'http://api/logo.jpg' }}
        posicaoUsuario={null}
        onClose={vi.fn()}
      />,
    );
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('http://api/logo.jpg');
  });

  it('exibe distância quando posicaoUsuario é fornecida', () => {
    render(
      <EstabelecimentoDrawer
        estabelecimento={estabelecimentoMock}
        posicaoUsuario={[-10.180, -48.330]}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/km/i)).toBeDefined();
  });
});
