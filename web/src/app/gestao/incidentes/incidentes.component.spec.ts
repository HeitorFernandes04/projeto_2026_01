import '@angular/compiler';

import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  IncidenteAuditoria,
  IncidentePendente,
  IncidentesService,
} from '../../services/incidentes.service';
import { IncidentesComponent } from './incidentes.component';

const mockIncidentes: IncidentePendente[] = [
  {
    id: 11,
    ordem_servico_id: 1024,
    status_ordem_servico: 'BLOQUEADO_INCIDENTE',
    placa: 'BRA-2E19',
    modelo: 'Audi A3',
    servico: 'Lavagem Premium',
    tag_peca: 'Parachoque Dianteiro',
    descricao: 'Cliente reportou divergencia visual no para-choque.',
    foto_url: 'https://cdn.lavame.test/incidentes/11.jpg',
    data_registro: '2026-04-26T12:30:00Z',
  },
];

const mockAuditoria: IncidenteAuditoria = {
  id: 11,
  descricao: 'Cliente reportou divergencia visual no para-choque.',
  foto_url: 'https://cdn.lavame.test/incidentes/11.jpg',
  data_registro: '2026-04-26T12:30:00Z',
  resolvido: false,
  status_anterior_os: 'EM_EXECUCAO',
  vista_inicial_foto_url: 'https://cdn.lavame.test/vistoria/11.jpg',
  ordem_servico: {
    id: 1024,
    status: 'BLOQUEADO_INCIDENTE',
    placa: 'BRA-2E19',
    modelo: 'Audi A3',
    marca: 'Audi',
    cor: 'Preto',
    nome_dono: 'Marcos Cliente',
    celular_dono: '11999990000',
    funcionario_responsavel_nome: 'Lavador Responsavel',
    servico: 'Lavagem Premium',
    horario_lavagem: '2026-04-26T11:15:00Z',
    horario_acabamento: null,
    horario_finalizacao: null,
  },
  tag_peca: {
    id: 3,
    nome: 'Parachoque Dianteiro',
    categoria: 'EXTERNO',
  },
  vistoria_item: {
    id: 8,
    possui_avaria: true,
    foto_url: 'https://cdn.lavame.test/vistoria/11.jpg',
  },
};

const mockComparativo = {
  entrada: Array.from({ length: 5 }, (_, index) => ({
    id: index + 1,
    arquivo_url: `https://cdn.lavame.test/entrada/${index + 1}.jpg`,
    momento: 'VISTORIA_GERAL',
  })),
  incidente: [
    {
      id: 11,
      arquivo_url: 'https://cdn.lavame.test/incidentes/11.jpg',
      momento: 'INCIDENTE',
    },
  ],
  ordem_servico: {
    id: 1024,
    placa: 'BRA-2E19',
    modelo: 'Audi A3',
  },
};

describe('IncidentesComponent - RF-16', () => {
  let fixture: ComponentFixture<IncidentesComponent>;
  let component: IncidentesComponent;
  let pendentesSubject: BehaviorSubject<IncidentePendente[]>;
  let incidentesServiceSpy: {
    pendentes$: ReturnType<BehaviorSubject<IncidentePendente[]>['asObservable']>;
    iniciarMonitoramentoPendentes: ReturnType<typeof vi.fn>;
    pararMonitoramentoPendentes: ReturnType<typeof vi.fn>;
    recarregarPendentes: ReturnType<typeof vi.fn>;
    obterAuditoria: ReturnType<typeof vi.fn>;
    obterComparativo: ReturnType<typeof vi.fn>;
    resolverIncidente: ReturnType<typeof vi.fn>;
  };

  async function criarComponente() {
    await TestBed.configureTestingModule({
      imports: [IncidentesComponent],
      providers: [
        {
          provide: IncidentesService,
          useValue: incidentesServiceSpy,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidentesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    pendentesSubject = new BehaviorSubject<IncidentePendente[]>(mockIncidentes);

    incidentesServiceSpy = {
      pendentes$: pendentesSubject.asObservable(),
      iniciarMonitoramentoPendentes: vi.fn(),
      pararMonitoramentoPendentes: vi.fn(),
      recarregarPendentes: vi.fn().mockImplementation(() => of(pendentesSubject.value)),
      obterAuditoria: vi.fn().mockReturnValue(of(mockAuditoria)),
      obterComparativo: vi.fn().mockReturnValue(of(mockComparativo)),
      resolverIncidente: vi.fn().mockReturnValue(of({
        detail: 'Incidente resolvido com sucesso.',
        id: 11,
        ordem_servico_status: 'EM_EXECUCAO',
      })),
    };
  });

  afterEach(() => {
    fixture?.destroy();
    TestBed.resetTestingModule();
  });

  it('deve carregar incidentes pendentes da fonte reativa ao iniciar', async () => {
    await criarComponente();

    expect(incidentesServiceSpy.iniciarMonitoramentoPendentes).toHaveBeenCalled();
    expect(incidentesServiceSpy.recarregarPendentes).toHaveBeenCalledTimes(1);
    expect(component.incidentes).toEqual(mockIncidentes);
    expect(component.carregando).toBe(false);
    expect(fixture.nativeElement.querySelectorAll('[data-testid="incidente-card"]').length).toBe(1);
  });

  it('deve remover o botao manual de atualizar e evitar expor codigo interno no estado vazio', async () => {
    pendentesSubject = new BehaviorSubject<IncidentePendente[]>([]);
    incidentesServiceSpy.pendentes$ = pendentesSubject.asObservable();

    await criarComponente();

    expect(fixture.nativeElement.querySelector('[aria-label="Atualizar central de incidentes"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Nenhum incidente pendente no momento.');
    expect(fixture.nativeElement.textContent).not.toContain('BLOQUEADO_INCIDENTE');
  });

  it('deve buscar auditoria ao abrir o modal e renderizar foco em cliente e responsavel', async () => {
    await criarComponente();

    fixture.nativeElement.querySelector('[data-testid="incidente-card"]').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(incidentesServiceSpy.obterAuditoria).toHaveBeenCalledWith(11);
    expect(component.modalAberto).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Marcos Cliente');
    expect(fixture.nativeElement.textContent).toContain('11999990000');
    expect(fixture.nativeElement.textContent).toContain('Lavador Responsavel');
    expect(fixture.nativeElement.textContent).toContain('Parachoque Dianteiro');
    expect(fixture.nativeElement.textContent).not.toContain('Status anterior');
    expect(fixture.nativeElement.querySelector('[data-testid="entrada-foto"]')?.getAttribute('src'))
      .toBe('https://cdn.lavame.test/entrada/1.jpg');
  });

  it('deve renderizar auditoria side-by-side com 5 fotos de entrada e evidencias do incidente', async () => {
    await criarComponente();

    fixture.nativeElement.querySelector('[data-testid="incidente-card"]').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(incidentesServiceSpy.obterComparativo).toHaveBeenCalledWith(11);
    expect(fixture.nativeElement.textContent).toContain('Entrada');
    expect(fixture.nativeElement.textContent).toContain('Incidente');
    expect(fixture.nativeElement.querySelectorAll('[data-testid="entrada-foto"]').length).toBe(5);
    expect(fixture.nativeElement.querySelectorAll('[data-testid="incidente-foto"]').length).toBe(1);
  });

  it('deve ampliar uma foto ao clicar na miniatura e permitir fechar a visualizacao', async () => {
    await criarComponente();

    fixture.nativeElement.querySelector('[data-testid="incidente-card"]').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const botaoAmpliar = fixture.nativeElement.querySelector(
      '[aria-label="Ampliar foto de entrada 1"]',
    ) as HTMLButtonElement;
    botaoAmpliar.click();
    fixture.detectChanges();

    const visualizacao = fixture.nativeElement.querySelector('[data-testid="foto-ampliada"]') as HTMLImageElement;
    expect(visualizacao).toBeTruthy();
    expect(visualizacao.getAttribute('src')).toBe('https://cdn.lavame.test/entrada/1.jpg');
    expect(fixture.nativeElement.querySelector('[role="dialog"][aria-label="Visualizacao ampliada da foto"]'))
      .toBeTruthy();

    fixture.nativeElement.querySelector('[aria-label="Fechar foto ampliada"]').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="foto-ampliada"]')).toBeNull();
  });

  it('deve exibir placeholder elegante quando OS antiga nao possui fotos de entrada', async () => {
    incidentesServiceSpy.obterComparativo.mockReturnValue(of({
      ...mockComparativo,
      entrada: [],
    }));

    await criarComponente();

    fixture.nativeElement.querySelector('[data-testid="incidente-card"]').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="entrada-placeholder"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Sem fotos de entrada vinculadas a esta OS.');
  });

  it('deve manter botao resolver desabilitado enquanto a nota estiver vazia', async () => {
    await criarComponente();

    fixture.nativeElement.querySelector('[data-testid="incidente-card"]').click();
    fixture.detectChanges();

    const resolverButton = fixture.nativeElement.querySelector('[data-testid="resolver-button"]') as HTMLButtonElement;
    expect(resolverButton.disabled).toBe(true);
  });

  it('deve resolver incidente, fechar modal e sincronizar a lista reativa', async () => {
    incidentesServiceSpy.recarregarPendentes
      .mockImplementationOnce(() => of(mockIncidentes))
      .mockImplementationOnce(() => {
        pendentesSubject.next([]);
        return of([]);
      });

    const resolver$ = new Subject<{ detail: string; id: number; ordem_servico_status: string }>();
    incidentesServiceSpy.resolverIncidente.mockReturnValue(resolver$);

    await criarComponente();

    fixture.nativeElement.querySelector('[data-testid="incidente-card"]').click();
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector('[data-testid="nota-resolucao"]') as HTMLTextAreaElement;
    textarea.value = 'Conferido com fotos e liberado para retomada.';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const resolverButton = fixture.nativeElement.querySelector('[data-testid="resolver-button"]') as HTMLButtonElement;
    resolverButton.click();
    fixture.detectChanges();

    expect(incidentesServiceSpy.resolverIncidente).toHaveBeenCalledWith(
      11,
      'Conferido com fotos e liberado para retomada.',
    );
    expect(component.resolvendo).toBe(true);
    expect(resolverButton.disabled).toBe(true);

    resolver$.next({
      detail: 'Incidente resolvido com sucesso.',
      id: 11,
      ordem_servico_status: 'EM_EXECUCAO',
    });
    resolver$.complete();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.resolvendo).toBe(false);
    expect(component.modalAberto).toBe(false);
    expect(component.incidentes.length).toBe(0);
    expect(component.mensagemSucesso).toContain('OS #1024 liberada com sucesso.');
    expect(incidentesServiceSpy.recarregarPendentes).toHaveBeenCalledTimes(2);
  });

  it('deve exibir erro da auditoria quando o detalhamento falhar', async () => {
    incidentesServiceSpy.obterAuditoria.mockReturnValue(
      throwError(() => new Error('Falha na auditoria')),
    );

    await criarComponente();

    fixture.nativeElement.querySelector('[data-testid="incidente-card"]').click();
    fixture.detectChanges();

    expect(component.erroAuditoria).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Nao foi possivel carregar a auditoria deste incidente.');
  });

  it('deve exibir erro retornado pelo backend ao falhar a resolucao', async () => {
    incidentesServiceSpy.resolverIncidente.mockReturnValue(
      throwError(() => ({ error: { detail: 'O incidente informado ja foi resolvido.' } })),
    );

    await criarComponente();

    fixture.nativeElement.querySelector('[data-testid="incidente-card"]').click();
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector('[data-testid="nota-resolucao"]') as HTMLTextAreaElement;
    textarea.value = 'Tentativa duplicada.';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-testid="resolver-button"]').click();
    fixture.detectChanges();

    expect(component.modalAberto).toBe(true);
    expect(component.erroResolucao).toBe('O incidente informado ja foi resolvido.');
    expect(fixture.nativeElement.textContent).toContain('O incidente informado ja foi resolvido.');
  });
});
