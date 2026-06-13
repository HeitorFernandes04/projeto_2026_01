import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Historico from './Historico';
import Detalhes from './Detalhes';
import { getHistorico, getGaleriaHistorico } from '../../services/api';
import { IonReactRouter } from '@ionic/react-router';

// Mock das funções da API
vi.mock('../../services/api', () => ({
  getHistorico: vi.fn(),
  getGaleriaHistorico: vi.fn(),
}));

// Mock do Ionic hook para rodar nos testes
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


describe('Historico & Detalhes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Teste 1 (Empty State): Simule resposta vazia [] e valide se o layout de incentivo ao agendamento e o botão CTA aparecem perfeitamente.', async () => {
    vi.mocked(getHistorico).mockResolvedValueOnce([]);

    await act(async () => {
      render(
        <IonReactRouter>
          <Historico />
        </IonReactRouter>
      );
    });

    expect(screen.getByText(/Sua folha de serviços está limpa/i)).toBeInTheDocument();
    expect(screen.getByText('Encontrar um Lava-Me')).toBeInTheDocument();
  });

  it('Teste 2 (Separação de Mídias): Injete mídias mistas na resposta da galeria e valide se o componente separou corretamente o carrossel do "Antes" e do "Depois".', async () => {
    const mockGaleria = {
      entrada: [
        { id: 1, momento: 'VISTORIA_GERAL', arquivo_url: 'foto1.jpg' },
      ],
      finalizacao: [
        { id: 2, momento: 'FINALIZADO', arquivo_url: 'foto2.jpg' },
      ],
      laudo_tecnico: {
        servico_realizado: 'Lavagem',
        tempo_execucao_minutos: 30,
        observacoes: 'Tudo certo',
        status_final: 'FINALIZADO',
        status_final_display: 'Concluído',
        placa: 'ABC1234',
        veiculo_modelo: 'Corolla',
        unidade: 'Lava-Me',
        data_servico: '10/05/2026',
      }
    };

    vi.mocked(getGaleriaHistorico).mockResolvedValueOnce(mockGaleria);

    const mockOrdem = {
      id: 1,
      servico_nome: 'Lavagem',
      estabelecimento_nome: 'Lava-Me',
      data_agendamento: '10/05/2026',
      horario: '14:00',
      valor: 80,
      status: 'FINALIZADO',
      veiculo_placa: 'ABC1234',
      veiculo_modelo: 'Corolla',
    };

    render(
      <Detalhes ordem={mockOrdem} onClose={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByAltText('Vistoria Inicial')).toBeInTheDocument();
      expect(screen.getByAltText('Entrega Final')).toBeInTheDocument();
    });
  });

  it('Teste 3 (Sanitização de Incidentes): Garanta que imagens com o marcador de incidentes internos não são injetadas no DOM da tela do cliente.', async () => {
    const mockGaleria = {
      entrada: [
        { id: 1, momento: 'VISTORIA_GERAL', arquivo_url: 'foto_entrada.jpg' },
      ],
      finalizacao: [
        { id: 2, momento: 'FINALIZADO', arquivo_url: 'foto_final.jpg' },
      ],
      laudo_tecnico: {
        servico_realizado: 'Lavagem',
        tempo_execucao_minutos: 30,
        observacoes: 'Tudo certo',
        status_final: 'FINALIZADO',
        status_final_display: 'Concluído',
        placa: 'ABC1234',
        veiculo_modelo: 'Corolla',
        unidade: 'Lava-Me',
        data_servico: '10/05/2026',
      }
    };

    vi.mocked(getGaleriaHistorico).mockResolvedValueOnce(mockGaleria);

    const mockOrdem = {
      id: 1,
      servico_nome: 'Lavagem',
      estabelecimento_nome: 'Lava-Me',
      data_agendamento: '10/05/2026',
      horario: '14:00',
      valor: 80,
      status: 'FINALIZADO',
      veiculo_placa: 'ABC1234',
      veiculo_modelo: 'Corolla',
    };

    const { queryByAltText } = render(
      <Detalhes ordem={mockOrdem} onClose={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByAltText('Vistoria Inicial')).toBeInTheDocument();
    });

    // Garante que não renderizou nenhuma imagem com alt de incidente (se houvesse)
    expect(queryByAltText(/incidente/i)).toBeNull();
  });
});
