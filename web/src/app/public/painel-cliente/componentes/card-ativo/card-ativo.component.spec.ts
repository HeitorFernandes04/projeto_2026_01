/**
 * Testes do CardAtivoComponent — RF-24 (Cancelamento Autônomo)
 * Cobrem: podeCancelar, cancelarAgendamento(), feedback de erro e emissão de evento.
 */
import '@angular/compiler';
import { of, throwError } from 'rxjs';
import { CardAtivoComponent } from './card-ativo.component';
import { OrdemServicoCliente } from '../../../../services/painel-cliente.service';

// ── Factories de dados alinhadas com OrdemServicoCliente (RF-25 interface) ──

const makeAtivo = (overrides: Partial<OrdemServicoCliente> = {}): OrdemServicoCliente => ({
  id: 1,
  data_hora: '2026-05-10T10:00:00',
  status: 'PATIO',
  status_display: 'Pátio',
  etapa_atual: 1,
  servico_nome: 'Lavagem Básica',
  veiculo_placa: 'BRA-2E19',
  veiculo_modelo: 'Toyota Corolla',
  slug_cancelamento: 'f475af97-c771-4d7a-ba1d-1047db93d0e9',
  estabelecimento: { nome_fantasia: 'Lava-Me Centro', slug: 'lava-me-centro' },
  ...overrides,
});

// ── Helper: mock do OrdemServicoService ──────────────────────────────────────

const mockServicoOk = {
  cancelarAgendamento: vi.fn(() => of({ detail: 'Agendamento cancelado com sucesso.' })),
};

const mockServicoErro403 = {
  cancelarAgendamento: vi.fn(() =>
    throwError(() => ({ error: { detail: 'Não é possível cancelar um serviço que já foi iniciado.' } }))
  ),
};

const mockServicoErro400 = {
  cancelarAgendamento: vi.fn(() =>
    throwError(() => ({ error: { detail: 'O cancelamento só é permitido com 1 hora de antecedência.' } }))
  ),
};

// ── Criação do componente injetando o serviço mock ──────────────────────────

function criarComponente(mockServico = mockServicoOk) {
  const component = new CardAtivoComponent();
  // Injeta o mock diretamente na propriedade privada (sem DI completa)
  (component as any).ordemServicoService = mockServico;
  return component;
}

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 1: podeCancelar — guarda de exibição do botão (RF-24.1 + RF-24.3)
// ═════════════════════════════════════════════════════════════════════════════
describe('CardAtivoComponent — podeCancelar (RF-24.1 + RF-24.3)', () => {
  it('deve ser TRUE quando status=PATIO e slug_cancelamento presente', () => {
    const c = criarComponente();
    c.ativo = makeAtivo({ status: 'PATIO', slug_cancelamento: 'uuid-valido' });
    expect(c.podeCancelar).toBe(true);
  });

  it('deve ser FALSE quando status não é PATIO (vistoria já iniciada)', () => {
    const c = criarComponente();
    for (const status of ['VISTORIA_INICIAL', 'EM_EXECUCAO', 'LIBERACAO', 'FINALIZADO', 'CANCELADO'] as any[]) {
      c.ativo = makeAtivo({ status });
      expect(c.podeCancelar).toBe(false);
    }
  });

  it('deve ser FALSE quando slug_cancelamento está ausente (OS sem UUID)', () => {
    const c = criarComponente();
    c.ativo = makeAtivo({ status: 'PATIO', slug_cancelamento: undefined });
    expect(c.podeCancelar).toBe(false);
  });

  it('deve ser FALSE quando ativo é undefined', () => {
    const c = criarComponente();
    (c as any).ativo = undefined;
    expect(c.podeCancelar).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 2: cancelarAgendamento() — fluxo de sucesso (CA-01)
// ═════════════════════════════════════════════════════════════════════════════
describe('CardAtivoComponent — cancelamento sucesso (CA-01)', () => {
  it('deve chamar o serviço com o slug correto via PATCH', () => {
    const mock = { cancelarAgendamento: vi.fn(() => of({ detail: 'ok' })) };
    const c = criarComponente(mock);
    c.ativo = makeAtivo();

    c.cancelarAgendamento();

    expect(mock.cancelarAgendamento).toHaveBeenCalledWith('f475af97-c771-4d7a-ba1d-1047db93d0e9', '');
  });

  it('deve emitir o id da OS via @Output cancelado após sucesso', () => {
    const c = criarComponente();
    c.ativo = makeAtivo({ id: 42 });

    let idEmitido: number | undefined;
    c.cancelado.subscribe((id: number) => { idEmitido = id; });

    c.cancelarAgendamento();

    expect(idEmitido).toBe(42);
  });

  it('deve resetar estado cancelando=false após sucesso', () => {
    const c = criarComponente();
    c.ativo = makeAtivo();

    c.cancelarAgendamento();

    expect(c.cancelando).toBe(false);
  });

  it('deve limpar erroCancelamento antes de cada tentativa', () => {
    const c = criarComponente();
    c.ativo = makeAtivo();
    c.erroCancelamento = 'Erro anterior';

    c.cancelarAgendamento();

    expect(c.erroCancelamento).toBe('');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 3: cancelarAgendamento() — bloqueios de status (CA-03)
// ═════════════════════════════════════════════════════════════════════════════
describe('CardAtivoComponent — bloqueio por status iniciado (CA-03)', () => {
  it('deve exibir mensagem de erro 403 (serviço já iniciado)', () => {
    const c = criarComponente(mockServicoErro403);
    c.ativo = makeAtivo({ status: 'PATIO' }); // backend decide, frontend só envia

    c.cancelarAgendamento();

    expect(c.erroCancelamento).toBe('Não é possível cancelar um serviço que já foi iniciado.');
    expect(c.cancelando).toBe(false);
  });

  it('deve exibir mensagem de erro 400 (antecedência insuficiente)', () => {
    const c = criarComponente(mockServicoErro400);
    c.ativo = makeAtivo();

    c.cancelarAgendamento();

    expect(c.erroCancelamento).toBe('O cancelamento só é permitido com 1 hora de antecedência.');
  });

  it('deve usar mensagem genérica quando detail não está no erro', () => {
    const mock = { cancelarAgendamento: vi.fn(() => throwError(() => ({}))) };
    const c = criarComponente(mock);
    c.ativo = makeAtivo();

    c.cancelarAgendamento();

    expect(c.erroCancelamento).toBe('Não foi possível cancelar. Tente novamente.');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 4: Guards de duplo clique e estado
// ═════════════════════════════════════════════════════════════════════════════
describe('CardAtivoComponent — guards de estado', () => {
  it('não deve chamar o serviço se podeCancelar for false', () => {
    const mock = { cancelarAgendamento: vi.fn(() => of({ detail: 'ok' })) };
    const c = criarComponente(mock);
    c.ativo = makeAtivo({ status: 'EM_EXECUCAO' }); // podeCancelar = false

    c.cancelarAgendamento();

    expect(mock.cancelarAgendamento).not.toHaveBeenCalled();
  });

  it('não deve chamar o serviço enquanto cancelando=true (duplo clique)', () => {
    const mock = { cancelarAgendamento: vi.fn(() => of({ detail: 'ok' })) };
    const c = criarComponente(mock);
    c.ativo = makeAtivo();
    c.cancelando = true; // simula clique duplo

    c.cancelarAgendamento();

    expect(mock.cancelarAgendamento).not.toHaveBeenCalled();
  });
});
