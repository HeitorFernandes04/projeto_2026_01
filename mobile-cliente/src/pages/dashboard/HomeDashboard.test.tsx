import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import HomeDashboard from './HomeDashboard';
import { getPainelCliente } from '../../services/api';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, beforeEach, it, expect } from 'vitest';


// Mock da API
vi.mock('../../services/api');
const mockGetPainelCliente = vi.mocked(getPainelCliente);

// Mock do Ionic hook para simular a execução no teste
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    useIonViewWillEnter: (cb: () => void) => {
      React.useEffect(() => {
        cb();
      }, []);
    },
  };
});

const renderComponent = () => render(
  <BrowserRouter>
    <HomeDashboard />
  </BrowserRouter>
);

describe('HomeDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Cenário 1 (Estado A Válido): OS com status PATIO na data de hoje DEVE renderizar o card de progresso ativo', async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    mockGetPainelCliente.mockResolvedValue({
      cliente_nome: 'Letícia',
      ativos: [
        {
          id: 1,
          veiculo_placa: 'ABC1234',
          veiculo_modelo: 'Corolla',
          servico_nome: 'Lavagem Completa',
          estabelecimento: { nome_fantasia: 'Lava Rápido Premium', slug: 'lava-rapido-premium' },
          status: 'PATIO',
          status_display: 'No pátio',
          data_hora: `${todayStr}T10:00:00`,
          etapa_atual: 20,
        },
      ],
      historico: [],
    } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Olá, Letícia!')).toBeInTheDocument();
      expect(screen.getByText('No pátio')).toBeInTheDocument();
      expect(screen.getByText('20%')).toBeInTheDocument();
    });
  });

  it('Cenário 2 (Bloqueio de data futura - Estado B): OS com status PATIO com data de amanhã NÃO DEVE renderizar o card ativo', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    mockGetPainelCliente.mockResolvedValue({
      cliente_nome: 'Letícia',
      ativos: [
        {
          id: 1,
          veiculo_placa: 'ABC1234',
          veiculo_modelo: 'Corolla',
          servico_nome: 'Lavagem Completa',
          estabelecimento: { nome_fantasia: 'Lava Rápido Premium', slug: 'lava-rapido-premium' },
          status: 'PATIO',
          status_display: 'No pátio',
          data_hora: `${tomorrowStr}T10:00:00`,
          etapa_atual: 20,
        },
      ],
      historico: [],
    } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Olá, Letícia!')).toBeInTheDocument();
      expect(screen.queryByText('Status do Serviço')).not.toBeInTheDocument();
      expect(screen.getByText('Agendar Nova Lavagem')).toBeInTheDocument();
      // Deve aparecer em "Próximos agendamentos"
      expect(screen.getByText('Próximos agendamentos')).toBeInTheDocument();
    });
  });

  it('Cenário 3 (Status em execução): OS com status EM_EXECUCAO mesmo em datas remanescentes deve exibir o card de progresso ativo', async () => {
    mockGetPainelCliente.mockResolvedValue({
      cliente_nome: 'Letícia',
      ativos: [
        {
          id: 1,
          veiculo_placa: 'ABC1234',
          veiculo_modelo: 'Corolla',
          servico_nome: 'Lavagem Completa',
          estabelecimento: { nome_fantasia: 'Lava Rápido Premium', slug: 'lava-rapido-premium' },
          status: 'EM_EXECUCAO',
          status_display: 'Lavagem em andamento',
          data_hora: '2026-05-10T10:00:00', // Data passada
          etapa_atual: 65,
        },
      ],
      historico: [],
    } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Olá, Letícia!')).toBeInTheDocument();
      expect(screen.getByText('Lavagem em andamento')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
    });
  });

  it('dispara a busca de dados no useIonViewWillEnter', async () => {
    mockGetPainelCliente.mockResolvedValue({
      cliente_nome: 'Letícia',
      ativos: [],
      historico: [],
    } as any);

    renderComponent();

    expect(mockGetPainelCliente).toHaveBeenCalledTimes(1);
  });
});
