import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import '@angular/compiler';
import { of, throwError } from 'rxjs';

import { GaleriaTransparenciaComponent } from './galeria-transparencia.component';
import {
  GaleriaClienteResponse,
  PainelClienteService,
} from '../../../../services/painel-cliente.service';

const galeriaMock: GaleriaClienteResponse = {
  ordem_servico_id: 42,
  entrada: [
    { id: 1, arquivo_url: 'http://api/os/antes.jpg', momento: 'VISTORIA_INICIAL' },
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

function criarComponente(osId: string | null = '42') {
  const routerSpy = {
    url: '/agendar/lava-me-centro/painel/galeria-transparencia',
    navigate: vi.fn(),
  } as unknown as Router;
  const locationSpy = { back: vi.fn() } as unknown as Location;
  const routeSpy = {
    snapshot: {
      queryParamMap: {
        get: vi.fn().mockReturnValue(osId),
      },
    },
  } as unknown as ActivatedRoute;
  const serviceSpy = {
    getGaleriaTransparencia: vi.fn().mockReturnValue(of(galeriaMock)),
  } as unknown as PainelClienteService;
  const cdrSpy = { markForCheck: vi.fn() } as unknown as ChangeDetectorRef;

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: Router, useValue: routerSpy },
      { provide: Location, useValue: locationSpy },
      { provide: ActivatedRoute, useValue: routeSpy },
      { provide: PainelClienteService, useValue: serviceSpy },
      { provide: ChangeDetectorRef, useValue: cdrSpy },
    ],
  });

  const component = TestBed.runInInjectionContext(() => new GaleriaTransparenciaComponent());

  return { component, routerSpy, locationSpy, serviceSpy, cdrSpy };
}

describe('GaleriaTransparenciaComponent - RF-26', () => {
  it('deve carregar a galeria usando o id da OS na query string', () => {
    const { component, serviceSpy } = criarComponente('42');

    component.ngOnInit();

    expect(component.osId).toBe(42);
    expect(serviceSpy.getGaleriaTransparencia).toHaveBeenCalledWith(42);
    expect(component.galeria).toEqual(galeriaMock);
    expect(component.carregando).toBe(false);
  });

  it('deve considerar fotos de auditoria inicial e finalizacao no total publico', () => {
    const { component } = criarComponente('42');

    component.ngOnInit();

    expect(component.totalFotos()).toBe(2);
    expect(component.fotosEntrada().length).toBe(1);
  });

  it('deve expor dados do laudo tecnico recebidos da API', () => {
    const { component } = criarComponente('42');

    component.ngOnInit();

    expect(component.laudoTecnico()?.servico_realizado).toBe('Lavagem Completa');
    expect(component.laudoTecnico()?.tempo_execucao_minutos).toBe(75);
    expect(component.laudoTecnico()?.observacoes).toBe('Cliente aprovou entrega no patio.');
    expect(component.laudoTecnico()?.status_final_display).toBe('Finalizado');
    expect(component.laudoTecnico()?.placa).toBe('ABC-1234');
    expect(component.laudoTecnico()?.unidade).toBe('Lava-Me Centro');
  });

  it('deve retornar classe visual verde para status finalizado', () => {
    const { component } = criarComponente('42');

    component.ngOnInit();

    expect(component.statusFinalClasse()).toBe('status-finalizado');
  });

  it('deve formatar momento de foto sem underscore e com texto humano', () => {
    const { component } = criarComponente('42');

    expect(component.formatarMomentoFoto('VISTORIA_INICIAL')).toBe('Vistoria inicial');
    expect(component.formatarMomentoFoto('FINALIZADO')).toBe('Finalizacao');
    expect(component.formatarMomentoFoto('AUDITORIA_POS_LAVAGEM')).toBe('Auditoria pos lavagem');
  });

  it('deve retornar descricao contextual para status finalizado', () => {
    const { component } = criarComponente('42');

    component.ngOnInit();

    expect(component.statusFinalDescricao()).toBe('Aguardando a retirada');
  });

  it('deve marcar erro quando a API rejeita a galeria', () => {
    const { component, serviceSpy } = criarComponente('42');
    vi.mocked(serviceSpy.getGaleriaTransparencia).mockReturnValue(
      throwError(() => new Error('400')),
    );

    component.ngOnInit();

    expect(component.erro).toBe('Nao foi possivel carregar a galeria desta OS.');
    expect(component.carregando).toBe(false);
  });

  it('deve marcar erro sem chamar API quando nao ha os na URL', () => {
    const { component, serviceSpy } = criarComponente(null);

    component.ngOnInit();

    expect(serviceSpy.getGaleriaTransparencia).not.toHaveBeenCalled();
    expect(component.erro).toBe('Ordem de servico nao informada.');
    expect(component.carregando).toBe(false);
  });

  it('deve abrir e fechar foto ampliada', () => {
    const { component } = criarComponente('42');

    component.ampliarFoto('http://api/os/final.jpg');
    expect(component.fotoAmpliada).toBe('http://api/os/final.jpg');

    component.fecharFoto();
    expect(component.fotoAmpliada).toBeNull();
  });
});
