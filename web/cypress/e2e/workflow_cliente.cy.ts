/// <reference types="cypress" />

describe('Workflow do Cliente (Portal B2C)', () => {
  const BASE_PATH = '/agendar/matriz';

  beforeEach(() => {
    // Intercepta Login B2C
    cy.intercept('POST', '**/api/publico/auth/login/', {
      statusCode: 200,
      body: { 
        access: 'mock-b2c-token', 
        refresh: 'mock-b2c-refresh' 
      }
    }).as('loginRequest');

    // Intercepta Perfil para o Guard
    cy.intercept('GET', '**/api/auth/meu_perfil/', {
      statusCode: 200,
      body: { 
        id: 1, 
        nome: 'Marcos Teste', 
        tipo_perfil: 'CLIENTE' 
      }
    }).as('getPerfil');

    // Intercepta Dados do Painel (Corrigido para bater com a interface PainelStatus)
    cy.intercept('GET', '**/api/cliente/painel/', {
      statusCode: 200,
      body: {
        cliente_nome: 'Marcos Teste',
        ativos: [
          {
            id: 101,
            data_hora: '2026-05-07T14:00:00Z',
            status: 'EM_EXECUCAO',
            status_display: 'Em Execução',
            etapa_atual: 3,
            servico_nome: 'Lavagem',
            veiculo_placa: 'LAV2026',
            veiculo_modelo: 'Audi A3',
            estabelecimento: { nome_fantasia: 'Lava-Me Matriz', slug: 'matriz' }
          }
        ],
        historico: [
          {
            id: 99,
            data_hora: '2026-05-01T10:00:00Z',
            status: 'FINALIZADO',
            status_display: 'Concluído',
            etapa_atual: 4,
            servico_nome: 'Polimento',
            veiculo_placa: 'OLD1234',
            veiculo_modelo: 'Fusca',
            estabelecimento: { nome_fantasia: 'Lava-Me Matriz', slug: 'matriz' }
          }
        ]
      }
    }).as('getPainel');

    // Intercepta Galeria Pós-Venda (Corrigido para GaleriaClienteResponse)
    cy.intercept('GET', '**/api/shared/historico/99/galeria/', {
      statusCode: 200,
      body: {
        data: {
          ordem_servico_id: 99,
          entrada: [
            { id: 1, arquivo_url: 'https://via.placeholder.com/150', momento: 'VISTORIA_GERAL' }
          ],
          finalizacao: [
            { id: 2, arquivo_url: 'https://via.placeholder.com/150', momento: 'FINALIZADO' }
          ],
          laudo_tecnico: {
            servico_realizado: 'Polimento Cristalizado',
            tempo_execucao_minutos: 120,
            observacoes: 'Veiculo entregue em perfeitas condicoes.',
            status_final: 'FINALIZADO',
            status_final_display: 'Concluido',
            placa: 'OLD1234',
            veiculo_modelo: 'Fusca',
            unidade: 'Lava-Me Matriz',
            data_servico: '2026-05-01'
          }
        },
        meta: { perfil: 'CLIENTE' },
        errors: []
      }
    }).as('getGaleria');
  });

  it('deve realizar login B2C e verificar isolamento de tokens', () => {
    cy.visit(`${BASE_PATH}/cliente/login`);
    cy.get('#telefone-cliente', { timeout: 20000 }).should('be.visible');

    // Preenche credenciais
    cy.get('#telefone-cliente').type('11999999999');
    cy.get('#pin-cliente').type('1234');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    
    // O redirecionamento pode acionar o perfil
    cy.intercept('GET', '**/api/auth/meu_perfil/').as('perfilPosLogin');

    // VERIFICAÇÃO CRÍTICA DA PR 39: Isolamento de Storage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('b2c_access_token')).to.equal('mock-b2c-token');
      expect(win.localStorage.getItem('access_token')).to.be.null;
    });

    // Aguarda redirecionamento para o painel
    cy.url({ timeout: 20000 }).should('include', '/painel');
  });

  it('deve carregar o painel com ordens ativas e histórico', () => {
    cy.visit(`${BASE_PATH}/painel`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('b2c_access_token', 'mock-b2c-token');
      }
    });

    // O Guard sempre chama o perfil primeiro
    cy.wait('@getPerfil', { timeout: 15000 });
    cy.wait('@getPainel', { timeout: 15000 });

    // Verifica elementos do painel
    cy.contains('Marcos Teste', { timeout: 20000 }).should('be.visible');
    cy.contains('LAV2026').should('be.visible');
    
    // Verifica troca de aba
    cy.contains('Histórico').click();
    cy.contains('OLD1234').should('be.visible');
  });

  it('deve verificar o funcionamento do Polling (Requisito PR 39)', () => {
    // Inicia o clock ANTES da visita para capturar o timer do Angular
    cy.clock();

    cy.visit(`${BASE_PATH}/painel`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('b2c_access_token', 'mock-b2c-token');
      }
    });

    cy.wait('@getPerfil');
    cy.wait('@getPainel');
    
    // Verifica se houve a chamada inicial
    cy.get('@getPainel.all').should('have.length', 1);

    // Avança o tempo para disparar o polling (30s)
    cy.tick(31000);
    
    // Deve ter ocorrido a segunda chamada
    cy.get('@getPainel.all').should('have.length', 2);
  });

  it('deve acessar a galeria de fotos de um serviço finalizado', () => {
    cy.visit(`${BASE_PATH}/painel`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('b2c_access_token', 'mock-b2c-token');
      }
    });

    cy.wait('@getPerfil');
    cy.wait('@getPainel');
    
    cy.contains('button', 'Histórico').click();
    
    // Clica no botão específico dentro do card
    cy.contains('OLD1234').parents('app-card-historico').find('.btn-ver-dossie').click();

    cy.wait('@getGaleria', { timeout: 10000 });
    cy.contains('Galeria de Transparência').should('be.visible');
    cy.contains('Polimento Cristalizado').should('be.visible');
  });

  it('deve permitir iniciar o fluxo de novo agendamento', () => {
    cy.visit(`${BASE_PATH}/painel`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('b2c_access_token', 'mock-b2c-token');
      }
    });

    cy.wait('@getPerfil');
    cy.wait('@getPainel');
    
    cy.contains('button', 'Novo Agendamento').click();
    
    // Usa include para ignorar barra final
    cy.url().should('include', BASE_PATH);
  });
});
