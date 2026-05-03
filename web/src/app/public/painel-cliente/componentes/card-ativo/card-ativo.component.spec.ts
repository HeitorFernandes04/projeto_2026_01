/**
 * Testes do CardAtivoComponent (RF-25 - Painel do Cliente)
 * Cobrem funcionalidades do card de veículos ativos: exibição e cancelamento
 * Padrão: testes simples de componente com @Input
 */
import '@angular/compiler';
import { CardAtivoComponent } from './card-ativo.component';

// ── Dados de Teste ────────────────────────────────────────────────────────
const mockAtivo = {
  id: 1,
  modelo: 'Toyota Corolla',
  placa: 'ABC1D23',
  horario: '08:30',
  data: '15/01/2024',
  servico: 'Lavagem Completa',
  status: 'EM_EXECUCAO',
  previsao_entrega: '10:00'
};

const mockAtivoSemDados = null;

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 1: Inicialização e Props
// ═════════════════════════════════════════════════════════════════════════════
describe('CardAtivoComponent — Inicialização', () => {
  it('deve ser criado com sucesso', () => {
    const component = new CardAtivoComponent();
    expect(component).toBeTruthy();
  });

  it('deve iniciar com ativo undefined', () => {
    const component = new CardAtivoComponent();
    expect(component.ativo).toBeUndefined();
  });

  it('deve aceitar dados de ativo via @Input', () => {
    const component = new CardAtivoComponent();
    component.ativo = mockAtivo;
    
    expect(component.ativo).toEqual(mockAtivo);
    expect(component.ativo?.id).toBe(1);
    expect(component.ativo?.placa).toBe('ABC1D23');
  });

  it('deve aceitar valor nulo para ativo', () => {
    const component = new CardAtivoComponent();
    component.ativo = mockAtivoSemDados;
    
    expect(component.ativo).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 2: Funcionalidades do Componente
// ═════════════════════════════════════════════════════════════════════════════
describe('CardAtivoComponent — Funcionalidades', () => {
  let component: CardAtivoComponent;

  beforeEach(() => {
    component = new CardAtivoComponent();
    component.ativo = mockAtivo;
  });

  it('deve ter método cancelarAgendamento', () => {
    expect(typeof component.cancelarAgendamento).toBe('function');
  });

  it('deve registrar cancelamento no console', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    
    component.cancelarAgendamento();
    
    expect(consoleSpy).toHaveBeenCalledWith('Cancelar agendamento:', 1);
    consoleSpy.mockRestore();
  });

  it('deve lidar com cancelamento quando ativo é null', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    
    component.ativo = null;
    component.cancelarAgendamento();
    
    expect(consoleSpy).toHaveBeenCalledWith('Cancelar agendamento:', undefined);
    consoleSpy.mockRestore();
  });

  it('deve lidar com cancelamento quando ativo é undefined', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    
    component.ativo = undefined;
    component.cancelarAgendamento();
    
    expect(consoleSpy).toHaveBeenCalledWith('Cancelar agendamento:', undefined);
    consoleSpy.mockRestore();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 3: Validação de Dados
// ═════════════════════════════════════════════════════════════════════════════
describe('CardAtivoComponent — Validação de Dados', () => {
  it('deve acessar propriedades do ativo corretamente', () => {
    const component = new CardAtivoComponent();
    component.ativo = mockAtivo;
    
    expect(component.ativo?.modelo).toBe('Toyota Corolla');
    expect(component.ativo?.placa).toBe('ABC1D23');
    expect(component.ativo?.servico).toBe('Lavagem Completa');
    expect(component.ativo?.status).toBe('EM_EXECUCAO');
    expect(component.ativo?.horario).toBe('08:30');
    expect(component.ativo?.data).toBe('15/01/2024');
    expect(component.ativo?.previsao_entrega).toBe('10:00');
  });

  it('deve usar optional chaining para acessar propriedades', () => {
    const component = new CardAtivoComponent();
    component.ativo = null;
    
    expect(component.ativo?.id).toBeUndefined();
    expect(component.ativo?.placa).toBeUndefined();
    expect(component.ativo?.modelo).toBeUndefined();
  });

  it('deve aceitar diferentes estruturas de dados', () => {
    const component = new CardAtivoComponent();
    const ativoSimples = { id: 999, placa: 'TEST-123' };
    
    component.ativo = ativoSimples;
    
    expect(component.ativo?.id).toBe(999);
    expect(component.ativo?.placa).toBe('TEST-123');
    expect(component.ativo?.modelo).toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 4: Testes de Integração
// ═════════════════════════════════════════════════════════════════════════════
describe('CardAtivoComponent — Integração', () => {
  it('deve funcionar com dados completos do serviço', () => {
    const component = new CardAtivoComponent();
    const ativoCompleto = {
      id: 123,
      modelo: 'Honda Civic',
      placa: 'KYS-1234',
      horario: '14:00',
      data: '16/01/2024',
      servico: 'PREMIUM',
      status: 'PATIO',
      previsao_entrega: '14:45'
    };
    
    component.ativo = ativoCompleto;
    
    expect(component.ativo).toEqual(ativoCompleto);
    expect(component.ativo?.id).toBe(123);
    expect(component.ativo?.status).toBe('PATIO');
  });

  it('deve manter estado consistente após múltiplas atribuições', () => {
    const component = new CardAtivoComponent();
    
    // Primeira atribuição
    component.ativo = mockAtivo;
    expect(component.ativo?.id).toBe(1);
    
    // Segunda atribuição
    const outroAtivo = { ...mockAtivo, id: 456, placa: 'XYZ-789' };
    component.ativo = outroAtivo;
    expect(component.ativo?.id).toBe(456);
    expect(component.ativo?.placa).toBe('XYZ-789');
    
    // Limpar
    component.ativo = null;
    expect(component.ativo).toBeNull();
  });

  it('deve funcionar em cenário de uso típico', () => {
    const component = new CardAtivoComponent();
    
    // Simular uso típico: receber dados e permitir cancelamento
    component.ativo = mockAtivo;
    
    const consoleSpy = vi.spyOn(console, 'log');
    
    // Verificar que dados estão disponíveis
    expect(component.ativo?.placa).toBe('ABC1D23');
    expect(component.ativo?.servico).toBe('Lavagem Completa');
    
    // Verificar que cancelamento funciona
    component.cancelarAgendamento();
    expect(consoleSpy).toHaveBeenCalledWith('Cancelar agendamento:', 1);
    
    consoleSpy.mockRestore();
  });
});
