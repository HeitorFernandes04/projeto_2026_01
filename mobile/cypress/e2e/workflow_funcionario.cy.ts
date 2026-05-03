/// <reference types="cypress" />

describe('Workflow do Operador (Ordem de Serviço)', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/auth/login/', {
      statusCode: 200,
      body: { access: 'mock-access-token', refresh: 'mock-refresh-token' }
    }).as('loginRequest');

    cy.intercept('GET', '**/api/ordens-servico/hoje/', {
      statusCode: 200,
      body: []
    }).as('getOrdens');

    cy.intercept('GET', '**/api/gestao/servicos/', {
      statusCode: 200,
      body: [
        { id: 1, nome: 'Lavagem Completa', preco: '50.00' }
      ]
    }).as('getServicos');

    cy.intercept('POST', '**/api/ordens-servico/novo/', {
      statusCode: 201,
      body: { id: 123, status: 'PATIO' }
    }).as('criarOS');

    cy.intercept('GET', '**/api/ordens-servico/123/', {
      statusCode: 200,
      body: {
        id: 123,
        status: 'PATIO',
        veiculo: { placa: 'ABC1234', modelo: 'Gol', cor: 'Branco' },
        servico: { nome: 'Lavagem Completa' },
        midias: []
      }
    }).as('getOS');
  });

  it('deve realizar o fluxo completo de Pátio até Liberação', () => {
    // 1. Login
    cy.visit('/login');
    cy.get('input[type="email"]').type('funcionario@lava.me');
    cy.get('input[type="password"]').type('123456');
    cy.get('button').contains('Entrar').click();
    
    // Aguarda a resposta da API antes de validar o token
    cy.wait('@loginRequest');
    
    // O .should() vai tentar ler o localStorage repetidamente até que o valor apareça
    cy.window().its('localStorage.access').should('exist');

    // 2. Nova OS Expressa
    cy.visit('/ordens-servico/novo');
    cy.wait('@getServicos');

    cy.get('input[placeholder*="PLACA"]').type('ABC1234');
    cy.get('input[placeholder*="MODELO"]').type('Gol');
    cy.get('input[placeholder*="MARCA"]').type('VW');
    cy.get('input[placeholder*="COR"]').type('Branco');
    cy.contains('Lavagem Completa').click();
    
    // Aguarda estabilidade antes de clicar no botão
    cy.wait(500);
    cy.contains(/INICIAR ORDEM DE SERVIÇO AGORA/i).should('be.visible').click();
    cy.wait('@criarOS');

    // 3. Vistoria Inicial — Mock com 5 fotos VISTORIA_GERAL
    cy.intercept('GET', '**/api/ordens-servico/123/', {
      statusCode: 200,
      body: {
        id: 123,
        status: 'PATIO',
        veiculo: { placa: 'ABC1234', modelo: 'Gol', cor: 'Branco' },
        servico: { nome: 'Lavagem Completa' },
        midias: Array(5).fill({ momento: 'ENTRADA', arquivo: 'mock.jpg' })
      }
    }).as('getOSComFotos');

    cy.visit('/ordens-servico/123/esteira');
    cy.wait('@getOSComFotos');

    cy.contains('Fotos da Vistoria').should('be.visible');
    cy.contains('5/5 Fotos no Banco').should('be.visible');

    // Mock PATCH Vistoria -> EM_EXECUCAO
    cy.intercept('PATCH', '**/api/ordens-servico/123/avancar-etapa/', {
      statusCode: 200,
      body: { status: 'VISTORIA_INICIAL', etapa_atual: 2 }
    }).as('avancarExecucao');

    cy.intercept('GET', '**/api/ordens-servico/123/', {
      statusCode: 200,
      body: {
        id: 123,
        status: 'VISTORIA_INICIAL',
        etapa_atual: 2,
        veiculo: { placa: 'ABC1234', modelo: 'Gol', cor: 'Branco' },
        servico: { nome: 'Lavagem Completa' },
        midias: Array(5).fill({ momento: 'ENTRADA', arquivo: 'mock.jpg' })
      }
    }).as('getOSExecucao');

    cy.get('ion-textarea, textarea').type('Veículo sem avarias aparentes na entrada.', { force: true });
    cy.get('button').contains('CONCLUIR VISTORIA').click();
    cy.wait('@avancarExecucao');

    // 4. Em Execução — Lavagem
    cy.contains('Tempo Decorrido').should('exist');
    cy.contains('Pausar').should('exist');
    cy.contains('Relatar Problema').should('exist');

    cy.intercept('PATCH', '**/api/ordens-servico/123/avancar-etapa/', {
      statusCode: 200,
      body: { status: 'EM_EXECUCAO', etapa_atual: 3 }
    }).as('avancarAcabamento');

    cy.intercept('GET', '**/api/ordens-servico/123/', {
      statusCode: 200,
      body: {
        id: 123,
        status: 'EM_EXECUCAO',
        etapa_atual: 3,
        veiculo: { placa: 'ABC1234', modelo: 'Gol', cor: 'Branco' },
        servico: { nome: 'Lavagem Completa' },
        midias: Array(5).fill({ momento: 'ENTRADA', arquivo: 'mock.jpg' })
      }
    }).as('getOSAcabamento');

    cy.contains('Tempo Decorrido').should('be.visible');
    cy.get('ion-textarea, textarea').scrollIntoView().type('Lavagem finalizada com shampoo neutro.', { force: true });
    cy.get('button').contains(/Finalizar Lavagem/i).click();
    cy.wait('@avancarAcabamento');

    // 5. Acabamento
    cy.intercept('PATCH', '**/api/ordens-servico/123/avancar-etapa/', {
      statusCode: 200,
      body: { status: 'EM_EXECUCAO', etapa_atual: 4 }
    }).as('avancarLiberacao');

    cy.intercept('GET', '**/api/ordens-servico/123/', {
      statusCode: 200,
      body: {
        id: 123,
        status: 'EM_EXECUCAO',
        etapa_atual: 4,
        veiculo: { placa: 'ABC1234', modelo: 'Gol', cor: 'Branco' },
        servico: { nome: 'Lavagem Completa' },
        midias: Array(5).fill({ momento: 'FINALIZADO', arquivo: 'mock.jpg' })
      }
    }).as('getOSLiberacao');

    cy.get('ion-textarea, textarea').scrollIntoView().type('Acabamento interno realizado.', { force: true });
    cy.get('button').contains(/Relatar Problema/i).should('exist');
    cy.get('button').contains(/FINALIZAR ETAPA/i).click();
    cy.wait('@avancarLiberacao');

    // 6. Liberação
    cy.contains('Fotos de Entrega').should('be.visible');
  });

  it('deve bloquear a esteira ao registrar um incidente', () => {
    cy.intercept('POST', '**/api/ordens-servico/123/incidente/', {
      statusCode: 201,
      body: { success: true }
    }).as('registrarIncidente');

    cy.intercept('GET', '**/api/ordens-servico/123/', {
      statusCode: 200,
      body: { id: 123, status: 'BLOQUEADO_INCIDENTE' }
    }).as('getOSBloqueada');

    cy.visit('/ordens-servico/123/esteira');
    cy.wait('@getOSBloqueada');

    cy.contains('ESTEIRA SUSPENSA').should('be.visible');
    cy.get('button').contains('RETORNAR AO PÁTIO').click();
    cy.url().should('include', '/ordens-servico/hoje');
  });
});
