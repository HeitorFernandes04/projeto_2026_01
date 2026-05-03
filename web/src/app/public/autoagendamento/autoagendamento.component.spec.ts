/**
 * Testes do AutoagendamentoComponent (RF-21)
 * Cobre os Cenários BDD 4 e 5 da especificação rf21_draft_write_feature.md.
 * Padrão: mock manual do HttpClient (igual a servico.service.spec.ts do projeto).
 */
import '@angular/compiler';
import { of, throwError } from 'rxjs';
import { AutoagendamentoComponent } from './autoagendamento.component';
import {
  AutoagendamentoPublicoService,
  EstabelecimentoPublico,
} from '../../services/autoagendamento-publico.service';

// ── Dados de Teste ────────────────────────────────────────────────────────
const mockEstabelecimentoComServicos: EstabelecimentoPublico = {
  id: 1,
  nome_fantasia: 'Lava-Me Premium',
  endereco_completo: 'Rua das Flores, 123',
  servicos: [
    { id: 1, nome: 'Ducha Simples', preco: 30, duracao_estimada_minutos: 30 },
    { id: 2, nome: 'Lavagem Completa', preco: 80, duracao_estimada_minutos: 90 },
  ],
};

const mockEstabelecimentoSemServicos: EstabelecimentoPublico = {
  id: 2,
  nome_fantasia: 'Lava-Me Vazio',
  endereco_completo: 'Rua do Fim, 0',
  servicos: [],
};

// ── Factory: cria o componente com um mock de serviço ──────────────────────
function criarComponente(mockService: Partial<AutoagendamentoPublicoService>) {
  const mockRoute = {
    snapshot: { paramMap: { get: vi.fn().mockReturnValue('lava-me-premium') } },
  } as any;

  const mockCdr = { markForCheck: vi.fn() } as any;

  return new AutoagendamentoComponent(
    mockRoute,
    mockService as AutoagendamentoPublicoService,
    mockCdr,
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 1: Cenário 4 — Empty State
// ═════════════════════════════════════════════════════════════════════════════
describe('AutoagendamentoComponent — Empty State (CA-06)', () => {
  it('deve ter servicos vazio quando API retorna estabelecimento sem serviços', () => {
    const mockService = {
      getEstabelecimento: vi.fn().mockReturnValue(of(mockEstabelecimentoSemServicos)),
    };

    const component = criarComponente(mockService);
    component.ngOnInit();

    expect(component.servicos.length).toBe(0);
    expect(component.carregando).toBe(false);
    expect(component.erro).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 2: Cenário 5 — CTA desabilitado / habilitado (CA-07)
// ═════════════════════════════════════════════════════════════════════════════
describe('AutoagendamentoComponent — Controle do CTA (CA-07)', () => {
  let component: AutoagendamentoComponent;

  beforeEach(() => {
    const mockService = {
      getEstabelecimento: vi.fn().mockReturnValue(of(mockEstabelecimentoComServicos)),
    };
    component = criarComponente(mockService);
    component.ngOnInit();
  });

  it('deve iniciar com podeAvancar = false (nenhum serviço selecionado)', () => {
    expect(component.podeAvancar).toBe(false);
    expect(component.servicoSelecionado).toBeNull();
  });

  it('deve habilitar podeAvancar após selecionar um serviço', () => {
    const servico = mockEstabelecimentoComServicos.servicos[0];
    component.selecionarServico(servico);

    expect(component.podeAvancar).toBe(true);
    expect(component.servicoSelecionado).toEqual(servico);
  });

  it('deve permitir trocar o serviço selecionado', () => {
    const primeiro = mockEstabelecimentoComServicos.servicos[0];
    const segundo = mockEstabelecimentoComServicos.servicos[1];

    component.selecionarServico(primeiro);
    expect(component.servicoSelecionado?.id).toBe(primeiro.id);

    component.selecionarServico(segundo);
    expect(component.servicoSelecionado?.id).toBe(segundo.id);
    expect(component.podeAvancar).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 3: Estados de erro
// ═════════════════════════════════════════════════════════════════════════════
describe('AutoagendamentoComponent — Estados de erro', () => {
  it('deve marcar naoEncontrado = true quando API retorna 404', () => {
    const mockService = {
      getEstabelecimento: vi.fn().mockReturnValue(
        throwError(() => ({ status: 404 }))
      ),
    };

    const component = criarComponente(mockService);
    component.ngOnInit();

    expect(component.naoEncontrado).toBe(true);
    expect(component.erro).toBe(true);
    expect(component.carregando).toBe(false);
  });

  it('deve marcar erro = true para erros genéricos (ex: 500)', () => {
    const mockService = {
      getEstabelecimento: vi.fn().mockReturnValue(
        throwError(() => ({ status: 500 }))
      ),
    };

    const component = criarComponente(mockService);
    component.ngOnInit();

    expect(component.erro).toBe(true);
    expect(component.naoEncontrado).toBe(false);
    expect(component.carregando).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 4: Utilitários de formatação
// ═════════════════════════════════════════════════════════════════════════════
describe('AutoagendamentoComponent — Utilitários de formatação', () => {
  let component: AutoagendamentoComponent;

  beforeEach(() => {
    const mockService = {
      getEstabelecimento: vi.fn().mockReturnValue(of(mockEstabelecimentoComServicos)),
    };
    component = criarComponente(mockService);
  });

  it('deve formatar preço em reais (R$)', () => {
    const resultado = component.formatarPreco(80);
    expect(resultado).toContain('80');
    expect(resultado).toContain('R$');
  });

  it('deve formatar duração em minutos para menos de 1 hora', () => {
    expect(component.formatarDuracao(30)).toBe('30 min');
  });

  it('deve formatar duração em horas exatas', () => {
    expect(component.formatarDuracao(60)).toBe('1h');
  });

  it('deve formatar duração em horas e minutos', () => {
    expect(component.formatarDuracao(90)).toBe('1h 30min');
  });
});
// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 5: RF-26 — Simulação de Galeria
// ═════════════════════════════════════════════════════════════════════════════
describe('AutoagendamentoComponent — Simulação RF-26 (Dossiê Digital)', () => {
  it('deve carregar galeria após simular finalização do agendamento', () => {
    const mockMidias = [{ id: 1, arquivo: 'url_entrada', momento: 'ENTRADA' }];
    const mockService = {
      getEstabelecimento: vi.fn().mockReturnValue(of(mockEstabelecimentoComServicos)),
      getGaleria: vi.fn().mockReturnValue(of(mockMidias)),
    };

    const component = criarComponente(mockService);
    component.osIdParaGaleria = 123;

    component.finalizarAgendamento();

    expect(mockService.getGaleria).toHaveBeenCalledWith(123);
    expect(component.galeria).toEqual(mockMidias);
    expect(component.statusAgendamento).toBe('FINALIZADO');
  });
});
