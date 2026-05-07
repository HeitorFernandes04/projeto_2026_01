import '@angular/compiler';
import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AuthB2CService } from '../../services/auth-b2c.service';
import {
  OrdemServicoCliente,
  PainelClienteService,
  PainelStatus,
} from '../../services/painel-cliente.service';
import { PainelComponent } from './painel.component';

const ordemAtiva: OrdemServicoCliente = {
  id: 26,
  data_hora: '2026-05-06T13:00:00Z',
  status: 'EM_EXECUCAO',
  status_display: 'Em execucao',
  etapa_atual: 3,
  servico_nome: 'Lavagem completa',
  veiculo_placa: 'ABC-1234',
  veiculo_modelo: 'Onix',
  estabelecimento: {
    nome_fantasia: 'Lava-Me Centro',
    slug: 'lava-me-centro',
  },
};

function painelMock(ativos: OrdemServicoCliente[] = [ordemAtiva]): PainelStatus {
  return {
    cliente_nome: 'Maria Cliente',
    ativos,
    historico: [],
    historico_meta: { total: 0, limit: 10, has_more: false },
  };
}

async function criarComponente(respostas: PainelStatus[]) {
  const painelClienteService = {
    getDadosPainel: vi.fn(() => of(respostas.shift() ?? painelMock())),
  } as unknown as PainelClienteService;

  const router = {
    url: '/agendar/lava-me-centro/painel',
    navigate: vi.fn(),
  } as unknown as Router;

  await TestBed.configureTestingModule({
    imports: [PainelComponent],
    providers: [
      { provide: PainelClienteService, useValue: painelClienteService },
      { provide: AuthB2CService, useValue: { logout: vi.fn() } },
      { provide: Router, useValue: router },
      { provide: ChangeDetectorRef, useValue: { markForCheck: vi.fn() } },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(PainelComponent);
  const component = fixture.componentInstance;

  return { fixture, component, painelClienteService };
}

describe('PainelComponent - polling reativo RF-26', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('deve atualizar ordens ativas a cada 30 segundos enquanto houver OS ativa', async () => {
    const ordemAtualizada = { ...ordemAtiva, etapa_atual: 4, status: 'LIBERACAO' };
    const { fixture, component, painelClienteService } = await criarComponente([
      painelMock([ordemAtiva]),
      painelMock([ordemAtualizada]),
    ]);

    fixture.detectChanges();
    expect(component.ordensAtivas[0].etapa_atual).toBe(3);

    await vi.advanceTimersByTimeAsync(30000);

    expect(painelClienteService.getDadosPainel).toHaveBeenCalledTimes(2);
    expect(component.ordensAtivas[0].etapa_atual).toBe(4);
  });

  it('nao deve chamar a API no ciclo de polling quando nao houver OS ativa', async () => {
    const { fixture, painelClienteService } = await criarComponente([
      painelMock([]),
    ]);

    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(30000);

    expect(painelClienteService.getDadosPainel).toHaveBeenCalledTimes(1);
  });

  it('deve limpar o polling ao destruir o componente', async () => {
    const { fixture, component, painelClienteService } = await criarComponente([
      painelMock([ordemAtiva]),
      painelMock([ordemAtiva]),
    ]);

    fixture.detectChanges();
    component.ngOnDestroy();
    await vi.advanceTimersByTimeAsync(30000);

    expect(painelClienteService.getDadosPainel).toHaveBeenCalledTimes(1);
  });
});
