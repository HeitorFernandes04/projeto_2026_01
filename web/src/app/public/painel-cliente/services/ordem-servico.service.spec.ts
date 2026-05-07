import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrdemServicoService, OrdemServicoAPI, PainelResponse } from './ordem-servico.service';

const ordemAtiva: OrdemServicoAPI = {
  id: 1,
  data_hora: '2026-05-04T10:00:00Z',
  status: 'PATIO',
  status_display: 'Pátio',
  etapa_atual: 1,
  servico_nome: 'Lavagem Completa',
  veiculo_placa: 'ABC-1234',
  veiculo_modelo: 'Gol',
  estabelecimento: { nome_fantasia: 'Lava Rápido', slug: 'lava-rapido' },
};

const ordemFinalizada: OrdemServicoAPI = {
  id: 2,
  data_hora: '2026-04-20T09:00:00Z',
  status: 'FINALIZADO',
  status_display: 'Finalizado',
  etapa_atual: 4,
  servico_nome: 'Polimento',
  veiculo_placa: 'DEF-5678',
  veiculo_modelo: 'Civic',
  estabelecimento: { nome_fantasia: 'Lava Rápido', slug: 'lava-rapido' },
};

const painelMock: PainelResponse = {
  cliente_nome: 'João Silva',
  ativos: [ordemAtiva],
  historico: [ordemFinalizada],
};

describe('OrdemServicoService', () => {
  let service: OrdemServicoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrdemServicoService],
    });
    service = TestBed.inject(OrdemServicoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve ser criado com sucesso', () => {
    expect(service).toBeTruthy();
  });

  describe('getDadosPainel()', () => {
    it('deve fazer GET em /api/cliente/historico/', () => {
      service.getDadosPainel().subscribe();
      const req = httpMock.expectOne('/api/cliente/historico/');
      expect(req.request.method).toBe('GET');
      req.flush(painelMock);
    });

    it('deve retornar PainelResponse completo com cliente_nome, ativos e historico', () => {
      let resultado: PainelResponse | undefined;
      service.getDadosPainel().subscribe(r => (resultado = r));

      const req = httpMock.expectOne('/api/cliente/historico/');
      req.flush(painelMock);

      expect(resultado).toBeTruthy();
      expect(resultado!.cliente_nome).toBe('João Silva');
      expect(resultado!.ativos.length).toBe(1);
      expect(resultado!.historico.length).toBe(1);
    });

    it('deve mapear corretamente os campos de OrdemServicoAPI', () => {
      let resultado: PainelResponse | undefined;
      service.getDadosPainel().subscribe(r => (resultado = r));

      httpMock.expectOne('/api/cliente/historico/').flush(painelMock);

      const ativa = resultado!.ativos[0];
      expect(ativa.id).toBe(1);
      expect(ativa.status).toBe('PATIO');
      expect(ativa.status_display).toBe('Pátio');
      expect(ativa.etapa_atual).toBe(1);
      expect(ativa.servico_nome).toBe('Lavagem Completa');
      expect(ativa.veiculo_placa).toBe('ABC-1234');
      expect(ativa.veiculo_modelo).toBe('Gol');
      expect(ativa.estabelecimento.slug).toBe('lava-rapido');
    });

    it('deve retornar listas vazias quando não há ordens', () => {
      const semOrdens: PainelResponse = { cliente_nome: 'Maria', ativos: [], historico: [] };
      let resultado: PainelResponse | undefined;

      service.getDadosPainel().subscribe(r => (resultado = r));
      httpMock.expectOne('/api/cliente/historico/').flush(semOrdens);

      expect(resultado!.ativos).toEqual([]);
      expect(resultado!.historico).toEqual([]);
    });

    it('deve propagar erro HTTP 401 para o subscriber', () => {
      let erroRecebido: unknown;
      service.getDadosPainel().subscribe({ error: e => (erroRecebido = e) });

      httpMock.expectOne('/api/cliente/historico/').flush(
        { detail: 'Não autorizado' },
        { status: 401, statusText: 'Unauthorized' }
      );

      expect(erroRecebido).toBeTruthy();
    });

    it('deve propagar erro HTTP 403 para o subscriber', () => {
      let erroRecebido: unknown;
      service.getDadosPainel().subscribe({ error: e => (erroRecebido = e) });

      httpMock.expectOne('/api/cliente/historico/').flush(
        { detail: 'Proibido' },
        { status: 403, statusText: 'Forbidden' }
      );

      expect(erroRecebido).toBeTruthy();
    });
  });
});
