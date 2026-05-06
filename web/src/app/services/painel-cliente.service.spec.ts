import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import {
  GaleriaClienteResponse,
  PainelClienteService,
} from './painel-cliente.service';

const galeriaMock: GaleriaClienteResponse = {
  ordem_servico_id: 42,
  entrada: [
    { id: 1, arquivo_url: 'http://api/os/antes.jpg', momento: 'VISTORIA_GERAL' },
  ],
  finalizacao: [
    { id: 2, arquivo_url: 'http://api/os/final.jpg', momento: 'FINALIZADO' },
  ],
  laudo_tecnico: {
    servico_realizado: 'Lavagem Completa',
    tempo_execucao_minutos: 75,
    observacoes: 'Cliente aprovou entrega no patio.',
    status_final: 'FINALIZADO',
    status_final_display: 'Finalizado',
    placa: 'ABC-1234',
    veiculo_modelo: 'Onix',
    unidade: 'Lava-Me Centro',
    data_servico: '2026-05-05T10:00:00Z',
  },
};

describe('PainelClienteService - RF-26 Galeria Pos-Venda', () => {
  let service: PainelClienteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PainelClienteService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(PainelClienteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve buscar a galeria publica da OS do cliente autenticado', () => {
    let resultado: GaleriaClienteResponse | undefined;

    service.getGaleriaTransparencia(42).subscribe(data => (resultado = data));

    const req = httpMock.expectOne('/api/cliente/historico/42/galeria/');
    expect(req.request.method).toBe('GET');
    req.flush(galeriaMock);

    expect(resultado).toEqual(galeriaMock);
  });

  it('deve propagar erro da API quando a galeria nao estiver liberada', () => {
    let erroRecebido: unknown;

    service.getGaleriaTransparencia(42).subscribe({
      error: error => (erroRecebido = error),
    });

    httpMock.expectOne('/api/cliente/historico/42/galeria/').flush(
      { detail: 'Galeria disponivel apenas para ordens finalizadas.' },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(erroRecebido).toBeTruthy();
  });
});
