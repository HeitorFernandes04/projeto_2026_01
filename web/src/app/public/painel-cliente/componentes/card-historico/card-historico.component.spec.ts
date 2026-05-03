/**
 * Testes do CardHistoricoComponent (RF-25 - Painel do Cliente)
 * Cobrem funcionalidades do card de histórico: exibição e navegação para detalhes
 * Padrão: testes de componente com @Input e Router mockado
 */
import '@angular/compiler';
import { CardHistoricoComponent } from './card-historico.component';

// ── Dados de Teste ────────────────────────────────────────────────────────
const mockHistorico = {
  id: 3,
  modelo: 'VW Golf',
  placa: 'DEF4G56',
  horario: '14:00',
  data: '14/01/2024',
  servico: 'Polimento',
  status: 'FINALIZADO',
  previsao_entrega: '16:30'
};

// ── Factory: cria componente com Router mock ───────────────────────────────────
function criarComponente(url: string = '/agendar/lava-me-centro/painel') {
  const mockRouter = {
    url: url,
    navigate: vi.fn(),
  } as any;

  const component = new CardHistoricoComponent(mockRouter);
  
  return { component, mockRouter };
}

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 1: Inicialização e Props
// ═════════════════════════════════════════════════════════════════════════════
describe('CardHistoricoComponent — Inicialização', () => {
  it('deve ser criado com sucesso', () => {
    const { component } = criarComponente();
    expect(component).toBeTruthy();
  });

  it('deve iniciar com historico undefined', () => {
    const { component } = criarComponente();
    expect(component.historico).toBeUndefined();
  });

  it('deve aceitar dados de histórico via @Input', () => {
    const { component } = criarComponente();
    component.historico = mockHistorico;
    
    expect(component.historico).toEqual(mockHistorico);
    expect(component.historico?.id).toBe(3);
    expect(component.historico?.placa).toBe('DEF4G56');
    expect(component.historico?.status).toBe('FINALIZADO');
  });

  it('deve aceitar valor nulo para historico', () => {
    const { component } = criarComponente();
    component.historico = null;
    
    expect(component.historico).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 2: Funcionalidades de Navegação
// ═════════════════════════════════════════════════════════════════════════════
describe('CardHistoricoComponent — Navegação', () => {
  it('deve ter método verDetalhes', () => {
    const { component } = criarComponente();
    expect(typeof component.verDetalhes).toBe('function');
  });

  it('deve extrair slug corretamente da URL', () => {
    const { component, mockRouter } = criarComponente('/agendar/scala-sul/painel');
    component.historico = mockHistorico;
    
    component.verDetalhes();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/agendar/scala-sul/painel/galeria-transparencia'],
      { queryParams: { os: 3 } }
    );
  });

  it('deve extrair slug de URL com diferentes formatos', () => {
    const testCases = [
      { url: '/agendar/lava-me-centro/painel', expectedSlug: 'lava-me-centro' },
      { url: '/agendar/scala-shopping/painel', expectedSlug: 'scala-shopping' },
      { url: '/agendar/unidade-norte/painel', expectedSlug: 'unidade-norte' },
    ];

    testCases.forEach(({ url, expectedSlug }) => {
      const { component, mockRouter } = criarComponente(url);
      component.historico = mockHistorico;
      
      component.verDetalhes();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        [`/agendar/${expectedSlug}/painel/galeria-transparencia`],
        { queryParams: { os: 3 } }
      );
    });
  });

  it('deve passar ID do histórico como query parameter', () => {
    const { component, mockRouter } = criarComponente();
    component.historico = mockHistorico;
    
    component.verDetalhes();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/agendar/lava-me-centro/painel/galeria-transparencia'],
      { queryParams: { os: 3 } }
    );
  });

  it('deve lidar com histórico sem ID', () => {
    const { component, mockRouter } = criarComponente();
    component.historico = { ...mockHistorico, id: undefined };
    
    component.verDetalhes();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/agendar/lava-me-centro/painel/galeria-transparencia'],
      { queryParams: { os: undefined } }
    );
  });

  it('deve lidar com histórico null', () => {
    const { component, mockRouter } = criarComponente();
    component.historico = null;
    
    component.verDetalhes();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/agendar/lava-me-centro/painel/galeria-transparencia'],
      { queryParams: { os: undefined } }
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 3: Validação de Dados
// ═════════════════════════════════════════════════════════════════════════════
describe('CardHistoricoComponent — Validação de Dados', () => {
  it('deve acessar propriedades do histórico corretamente', () => {
    const { component } = criarComponente();
    component.historico = mockHistorico;
    
    expect(component.historico?.modelo).toBe('VW Golf');
    expect(component.historico?.placa).toBe('DEF4G56');
    expect(component.historico?.servico).toBe('Polimento');
    expect(component.historico?.status).toBe('FINALIZADO');
    expect(component.historico?.data).toBe('14/01/2024');
    expect(component.historico?.horario).toBe('14:00');
  });

  it('deve usar optional chaining para acessar propriedades', () => {
    const { component } = criarComponente();
    component.historico = null;
    
    expect(component.historico?.id).toBeUndefined();
    expect(component.historico?.placa).toBeUndefined();
    expect(component.historico?.modelo).toBeUndefined();
  });

  it('deve aceitar diferentes estruturas de dados', () => {
    const { component } = criarComponente();
    const historicoSimples = { id: 999, placa: 'TEST-123' };
    
    component.historico = historicoSimples;
    
    expect(component.historico?.id).toBe(999);
    expect(component.historico?.placa).toBe('TEST-123');
    expect(component.historico?.modelo).toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 4: Testes de Integração
// ═════════════════════════════════════════════════════════════════════════════
describe('CardHistoricoComponent — Integração', () => {
  it('deve funcionar com dados completos do serviço', () => {
    const { component, mockRouter } = criarComponente();
    const historicoCompleto = {
      id: 456,
      modelo: 'Chevrolet Onix',
      placa: 'ABC-1234',
      horario: '10:00',
      data: '15/01/2024',
      servico: 'PREMIUM',
      status: 'FINALIZADO',
      previsao_entrega: '10:45'
    };
    
    component.historico = historicoCompleto;
    component.verDetalhes();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/agendar/lava-me-centro/painel/galeria-transparencia'],
      { queryParams: { os: 456 } }
    );
  });

  it('deve manter estado consistente após múltiplas atribuições', () => {
    const { component } = criarComponente();
    
    // Primeira atribuição
    component.historico = mockHistorico;
    expect(component.historico?.id).toBe(3);
    
    // Segunda atribuição
    const outroHistorico = { ...mockHistorico, id: 789, placa: 'XYZ-789' };
    component.historico = outroHistorico;
    expect(component.historico?.id).toBe(789);
    expect(component.historico?.placa).toBe('XYZ-789');
    
    // Limpar
    component.historico = null;
    expect(component.historico).toBeNull();
  });

  it('deve funcionar em cenário de uso típico', () => {
    const { component, mockRouter } = criarComponente('/agendar/scala-sul/painel');
    
    // Simular uso típico: receber dados e navegar para detalhes
    component.historico = mockHistorico;
    
    // Verificar que dados estão disponíveis
    expect(component.historico?.placa).toBe('DEF4G56');
    expect(component.historico?.servico).toBe('Polimento');
    expect(component.historico?.status).toBe('FINALIZADO');
    
    // Verificar que navegação funciona
    component.verDetalhes();
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/agendar/scala-sul/painel/galeria-transparencia'],
      { queryParams: { os: 3 } }
    );
  });

  it('deve lidar com URL malformada', () => {
    const { component, mockRouter } = criarComponente('/agendar');
    component.historico = mockHistorico;
    
    component.verDetalhes();
    
    // Deve tentar navegar mesmo com URL malformada
    expect(mockRouter.navigate).toHaveBeenCalled();
  });
});
