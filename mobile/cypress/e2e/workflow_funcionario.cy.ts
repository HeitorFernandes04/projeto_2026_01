/// <reference types="cypress" />

describe('Workflow do Funcionário (Esteira Industrial)', () => {
  beforeEach(() => {
    // Intercepta o Login
    cy.intercept('POST', '**/api/auth/login/', {
      statusCode: 200,
      body: { access: 'mock-access-token', refresh: 'mock-refresh-token' }
    }).as('loginRequest');

    // Intercepta a lista de atendimentos do dia
    cy.intercept('GET', '**/api/atendimentos/hoje/', {
      statusCode: 200,
      body: []
    }).as('getAtendimentos');

    // Intercepta a lista de serviços
    cy.intercept('GET', '**/api/atendimentos/servicos/', {
      statusCode: 200,
      body: [
        { id: 1, nome: 'Lavagem Completa', preco: '50.00' }
      ]
    }).as('getServicos');

    // Intercepta a criação de atendimento
    cy.intercept('POST', '**/api/atendimentos/novo/', {
      statusCode: 201,
      body: { id: 123, status: 'agendado' }
    }).as('criarAtendimento');

    // Intercepta detalhes do atendimento
    cy.intercept('GET', '**/api/atendimentos/123/', {
      statusCode: 200,
      body: { 
        id: 123, 
        status: 'agendado', 
        veiculo: { placa: 'ABC1234', modelo: 'Gol', cor: 'Branco' },
        servico: { nome: 'Lavagem Completa' },
        midias: []
      }
    }).as('getDetalhes');
  });

  it('deve realizar o fluxo completo de entrada até a liberação', () => {
    // 1. Login e Verificação de localStorage
    cy.visit('/login');
    cy.get('input[type="email"]').type('funcionario@lava.me');
    cy.get('input[type="password"]').type('123456');
    cy.get('button').contains('Entrar').click();
    
    cy.wait('@loginRequest').then(() => {
      expect(localStorage.getItem('access')).to.eq('mock-access-token');
    });

    // 2. Novo Atendimento (Entrada)
    cy.visit('/atendimentos/novo');
    cy.wait('@getServicos');
    
    cy.get('input[placeholder*="PLACA"]').type('ABC1234');
    cy.get('input[placeholder*="MODELO"]').type('Gol');
    cy.get('input[placeholder*="MARCA"]').type('VW');
    cy.get('input[placeholder*="COR"]').type('Branco');
    cy.contains('Lavagem Completa').click(); // Custom Card-based Select

    cy.get('button').contains('INICIAR ATENDIMENTO AGORA').click();
    cy.wait('@criarAtendimento');

    // 3. Esteira de Produção - Vistoria
    // Atualizamos o mock para já possuir 5 fotos e habilitar o botão de concluir vistoria
    cy.intercept('GET', '**/api/atendimentos/123/', {
      statusCode: 200,
      body: { 
        id: 123, 
        status: 'agendado', 
        veiculo: { placa: 'ABC1234', modelo: 'Gol', cor: 'Branco' },
        servico: { nome: 'Lavagem Completa' },
        midias: Array(5).fill({ momento: 'VISTORIA_GERAL', arquivo: 'mock.jpg' })
      }
    }).as('getDetalhesComFotos');

    // Simula o redirecionamento para a esteira
    cy.visit('/atendimentos/123/esteira');
    cy.wait('@getDetalhesComFotos');

    cy.contains('Fotos da Vistoria').should('be.visible');
    cy.contains('5/5 Fotos no Banco').should('be.visible');

    // Mock do avanço de etapa (Vistoria -> Lavagem)
    cy.intercept('PATCH', '**/api/atendimentos/123/avancar-etapa/', {
      statusCode: 200,
      body: { status: 'em_andamento', etapa_atual: 2 }
    }).as('avancarLavagem');
    
    // Atualiza o GET para a próxima etapa (Lavagem)
    cy.intercept('GET', '**/api/atendimentos/123/', {
      statusCode: 200,
      body: { 
        id: 123, 
        status: 'em_andamento', 
        etapa_atual: 2,
        veiculo: { placa: 'ABC1234', modelo: 'Gol', cor: 'Branco' },
        servico: { nome: 'Lavagem Completa' },
        midias: Array(5).fill({ momento: 'VISTORIA_GERAL', arquivo: 'mock.jpg' })
      }
    }).as('getDetalhesLavagem');

    // Como o GaleriaFotos usa o modal nativo, vamos apenas simular o preenchimento do laudo e clique
    cy.get('textarea').type('Veículo sem avarias aparentes na entrada.');
    
    // O botão estará habilitado pois retornamos 5 fotos no GET inicial
    cy.get('button').contains('CONCLUIR VISTORIA').click();
    cy.wait('@avancarLavagem');
    
    // Força uma visita (ou mock limpo) para renderizar a lavagem se não re-renderizar de imediato
    //cy.wait('@getDetalhesLavagem');

    // 5. Esteira de Produção - Acabamento
    // Atualiza o GET para a próxima etapa (Acabamento)
    cy.intercept('GET', '**/api/atendimentos/123/', {
      statusCode: 200,
      body: { 
        id: 123, 
        status: 'em_andamento', 
        etapa_atual: 3,
        veiculo: { placa: 'ABC1234', modelo: 'Gol', cor: 'Branco' },
        servico: { nome: 'Lavagem Completa' },
        midias: Array(5).fill({ momento: 'VISTORIA_GERAL', arquivo: 'mock.jpg' })
      }
    }).as('getDetalhesAcabamento');

    // 4. Esteira de Produção - Lavagem
    cy.contains('Tempo Decorrido').should('exist');
    cy.contains('Pausar').should('exist');
    cy.contains('Relatar Problema').should('exist');
    
    // Rola para o textarea e digita para evitar erros de visibilidade
    cy.get('textarea').scrollIntoView().type('Lavagem finalizada com shampoo neutro.');
    
    // Mock do avanço (Lavagem -> Acabamento)
    cy.intercept('PATCH', '**/api/atendimentos/123/avancar-etapa/', {
      statusCode: 200,
      body: { status: 'em_andamento', etapa_atual: 3 }
    }).as('avancarAcabamento');

    cy.get('button').contains(/Finalizar Lavagem/i).click();
    cy.wait('@avancarAcabamento');
    //cy.wait('@getDetalhesAcabamento');
    
    // Mock de avanço (Acabamento -> Liberação)
    cy.intercept('PATCH', '**/api/atendimentos/123/avancar-etapa/', {
      statusCode: 200,
      body: { status: 'em_andamento', etapa_atual: 4 }
    }).as('avancarLiberacao');

    // Atualiza GET para etapa de Liberação
    cy.intercept('GET', '**/api/atendimentos/123/', {
      statusCode: 200,
      body: { 
        id: 123, 
        status: 'em_andamento', 
        etapa_atual: 4,
        veiculo: { placa: 'ABC1234', modelo: 'Gol', cor: 'Branco' },
        servico: { nome: 'Lavagem Completa' },
        midias: Array(5).fill({ momento: 'FINALIZADO', arquivo: 'mock.jpg' })
      }
    }).as('getDetalhesLiberacao');

    // 5. Esteira de Produção - Acabamento (Tela)
    cy.get('textarea').scrollIntoView().type('Acabamento interno realizado.');
    cy.get('button').contains(/Relatar Problema/i).should('exist');
    cy.get('button').contains(/FINALIZAR ETAPA/i).click();
    cy.wait('@avancarLiberacao');

    // 6. Liberação
    cy.contains('Fotos de Entrega').should('be.visible');
  });

  it('deve bloquear a esteira ao registrar um incidente', () => {
    // Prepara mock de incidente
    cy.intercept('POST', '**/api/atendimentos/123/incidente/', {
      statusCode: 201,
      body: { success: true }
    }).as('registrarIncidente');

    // Prepara mock de detalhes retornando status INCIDENTE
    cy.intercept('GET', '**/api/atendimentos/123/', {
      statusCode: 200,
      body: { id: 123, status: 'INCIDENTE' }
    }).as('getDetalhesBloqueado');

    cy.visit('/atendimentos/123/esteira');
    cy.wait('@getDetalhesBloqueado');

    // Verifica tela de bloqueio
    cy.contains('ESTEIRA SUSPENSA').should('be.visible');
    cy.get('button').contains('RETORNAR AO PÁTIO').click();
    cy.url().should('include', '/atendimentos/hoje');
  });
});
