/**
 * Testes do CardHistoricoComponent (RF-25/RF-26).
 * O card recebe uma OrdemServicoCliente do historico RF-25 e navega para a
 * galeria de transparencia RF-26 usando o id da OS.
 */
import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { OrdemServicoCliente } from '../../../../services/painel-cliente.service';
import { CardHistoricoComponent } from './card-historico.component';

const mockHistorico: OrdemServicoCliente = {
  id: 3,
  data_hora: '2026-04-15T14:00:00Z',
  status: 'FINALIZADO',
  status_display: 'Finalizado',
  etapa_atual: 4,
  servico_nome: 'Polimento',
  veiculo_placa: 'DEF-4G56',
  veiculo_modelo: 'VW Golf',
  estabelecimento: { nome_fantasia: 'Lava-Me Centro', slug: 'lava-me-centro' },
  horario: '14:00',
  data: '15/04/2026',
  previsao_entrega: '16:30',
};

function criarHistorico(overrides: Partial<OrdemServicoCliente> = {}): OrdemServicoCliente {
  return { ...mockHistorico, ...overrides };
}

function criarComponente(url = '/agendar/lava-me-centro/painel') {
  const routerMock = {
    url,
    navigate: vi.fn(),
  } as unknown as Router;

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: Router, useValue: routerMock }],
  });

  const component = TestBed.runInInjectionContext(() => new CardHistoricoComponent());

  return { component, routerMock };
}

describe('CardHistoricoComponent - RF-25/RF-26', () => {
  it('deve ser criado com historico indefinido', () => {
    const { component } = criarComponente();

    expect(component).toBeTruthy();
    expect(component.historico).toBeUndefined();
  });

  it('deve aceitar OrdemServicoCliente atual como @Input', () => {
    const { component } = criarComponente();

    component.historico = mockHistorico;

    expect(component.historico).toEqual(mockHistorico);
    expect(component.historico?.id).toBe(3);
    expect(component.historico?.veiculo_placa).toBe('DEF-4G56');
    expect(component.historico?.veiculo_modelo).toBe('VW Golf');
    expect(component.historico?.servico_nome).toBe('Polimento');
    expect(component.historico?.status).toBe('FINALIZADO');
  });

  it('deve aceitar historico nulo', () => {
    const { component } = criarComponente();

    component.historico = null;

    expect(component.historico).toBeNull();
  });

  it('deve navegar para a galeria RF-26 usando o slug atual e o id da OS', () => {
    const { component, routerMock } = criarComponente('/agendar/scala-sul/painel');
    component.historico = mockHistorico;

    component.verDetalhes();

    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['/agendar/scala-sul/painel/galeria-transparencia'],
      { queryParams: { os: 3 } },
    );
  });

  it('deve extrair slug de diferentes URLs do painel cliente', () => {
    const casos = [
      { url: '/agendar/lava-me-centro/painel', slug: 'lava-me-centro' },
      { url: '/agendar/scala-shopping/painel', slug: 'scala-shopping' },
      { url: '/agendar/unidade-norte/painel', slug: 'unidade-norte' },
    ];

    for (const caso of casos) {
      const { component, routerMock } = criarComponente(caso.url);
      component.historico = mockHistorico;

      component.verDetalhes();

      expect(routerMock.navigate).toHaveBeenCalledWith(
        [`/agendar/${caso.slug}/painel/galeria-transparencia`],
        { queryParams: { os: 3 } },
      );
    }
  });

  it('deve enviar os undefined quando nao houver historico selecionado', () => {
    const { component, routerMock } = criarComponente();
    component.historico = null;

    component.verDetalhes();

    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['/agendar/lava-me-centro/painel/galeria-transparencia'],
      { queryParams: { os: undefined } },
    );
  });

  it('deve lidar com id ausente em dado legado sem quebrar a navegacao', () => {
    const { component, routerMock } = criarComponente();
    component.historico = criarHistorico({ id: undefined as unknown as number });

    component.verDetalhes();

    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['/agendar/lava-me-centro/painel/galeria-transparencia'],
      { queryParams: { os: undefined } },
    );
  });

  it('deve manter estado consistente apos multiplas atribuicoes', () => {
    const { component } = criarComponente();

    component.historico = mockHistorico;
    expect(component.historico?.id).toBe(3);

    component.historico = criarHistorico({
      id: 789,
      veiculo_placa: 'XYZ-789',
      servico_nome: 'Lavagem Completa',
    });

    expect(component.historico?.id).toBe(789);
    expect(component.historico?.veiculo_placa).toBe('XYZ-789');
    expect(component.historico?.servico_nome).toBe('Lavagem Completa');

    component.historico = null;
    expect(component.historico).toBeNull();
  });

  it('deve tentar navegar mesmo com URL malformada', () => {
    const { component, routerMock } = criarComponente('/agendar');
    component.historico = mockHistorico;

    component.verDetalhes();

    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['/agendar/undefined/painel/galeria-transparencia'],
      { queryParams: { os: 3 } },
    );
  });
});
