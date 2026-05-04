import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { OrdemServicoApiResponse, OrdemServicoService } from './ordem-servico.service';

const ordemApi: OrdemServicoApiResponse = {
  id: 123,
  veiculo: {
    placa: 'ABC-1D23',
    modelo: 'Honda Civic',
    nome_dono: 'Carlos Silva',
  },
  servico: {
    nome: 'Lavagem Completa',
    duracao_estimada_minutos: 60,
  },
  data_hora: '2026-05-05T13:00:00.000Z',
  status: 'PATIO',
  slug_cancelamento: 'f475af97-c771-4d7a-ba1d-1047db93d0e9',
};

function criarService(httpOverrides: Partial<HttpClient> = {}): OrdemServicoService {
  const http = {
    patch: vi.fn().mockReturnValue(of({ detail: 'Agendamento cancelado com sucesso.' })),
    ...httpOverrides,
  } as unknown as HttpClient;

  return new OrdemServicoService(http);
}

describe('OrdemServicoService - dados reais do checkout', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('inicia sem ordens quando nao existe OS real no sessionStorage', () => {
    const service = criarService();

    expect(service.getOrdensAtivas()).toEqual([]);
    expect(service.getOrdensFinalizadas()).toEqual([]);
  });

  it('carrega a OS real salva pelo checkout e mapeia os campos do card', () => {
    sessionStorage.setItem('ordemServicoAtiva', JSON.stringify(ordemApi));

    const service = criarService();
    const [ordem] = service.getOrdensAtivas();

    expect(ordem.id).toBe(123);
    expect(ordem.modelo).toBe('Honda Civic');
    expect(ordem.placa).toBe('ABC-1D23');
    expect(ordem.servico).toBe('Lavagem Completa');
    expect(ordem.status).toBe('PATIO');
    expect(ordem.slug_cancelamento).toBe('f475af97-c771-4d7a-ba1d-1047db93d0e9');
    expect(ordem.previsao_entrega).toBeTruthy();
  });

  it('nao lista OS cancelada como ativa', () => {
    sessionStorage.setItem('ordemServicoAtiva', JSON.stringify({ ...ordemApi, status: 'CANCELADO' }));

    const service = criarService();

    expect(service.getOrdensAtivas()).toEqual([]);
  });

  it('cancela usando o slug real e nunca o id sequencial', () => {
    const patch = vi.fn().mockReturnValue(of({ detail: 'Agendamento cancelado com sucesso.' }));
    const service = criarService({ patch } as Partial<HttpClient>);

    service.cancelarAgendamento('f475af97-c771-4d7a-ba1d-1047db93d0e9').subscribe();

    expect(patch).toHaveBeenCalledWith(
      '/api/publico/agendamento/ordens-servico/f475af97-c771-4d7a-ba1d-1047db93d0e9/cancelar/',
      { motivo_cancelamento: '' },
    );
  });

  it('remove a OS ativa e limpa o sessionStorage apos cancelamento confirmado', () => {
    sessionStorage.setItem('ordemServicoAtiva', JSON.stringify(ordemApi));
    const service = criarService();

    service.removerOrdemAtiva(123);

    expect(service.getOrdensAtivas()).toEqual([]);
    expect(sessionStorage.getItem('ordemServicoAtiva')).toBeNull();
  });
});
