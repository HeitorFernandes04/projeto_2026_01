import '@angular/compiler';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

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
    status_anterior_os: 'EM_EXECUCAO',
    placa: 'BRA-2E19',
    modelo: 'Audi A3',
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


describe('IncidentesComponent - RF-16', () => {
  let fixture: ComponentFixture<IncidentesComponent>;
  let component: IncidentesComponent;
  let incidentesServiceSpy: {
    listarPendentes: ReturnType<typeof vi.fn>;
    obterAuditoria: ReturnType<typeof vi.fn>;
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
  }

  beforeEach(() => {
    incidentesServiceSpy = {
      listarPendentes: vi.fn().mockReturnValue(of(mockIncidentes)),
      obterAuditoria: vi.fn().mockReturnValue(of(mockAuditoria)),
      resolverIncidente: vi.fn().mockReturnValue(of({
        detail: 'Incidente resolvido com sucesso.',
        id: 11,
        ordem_servico_status: 'EM_EXECUCAO',
      })),
    };
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('deve carregar incidentes pendentes da API ao iniciar', async () => {
    await criarComponente();

    expect(incidentesServiceSpy.listarPendentes).toHaveBeenCalledTimes(1);
    expect(component.incidentes).toEqual(mockIncidentes);
    expect(component.carregando).toBe(false);
    expect(component.erro).toBe(false);
    expect(fixture.nativeElement.querySelectorAll('[data-testid="incidente-card"]').length).toBe(1);
  });

  it('deve buscar auditoria ao abrir o modal e renderizar dados consolidados', async () => {
    await criarComponente();

    fixture.nativeElement.querySelector('[data-testid="incidente-card"]').click();
    fixture.detectChanges();

    expect(incidentesServiceSpy.obterAuditoria).toHaveBeenCalledWith(11);
    expect(component.modalAberto).toBe(true);
    expect(component.auditoriaSelecionada?.tag_peca.nome).toBe('Parachoque Dianteiro');
    expect(fixture.nativeElement.textContent).toContain('Status anterior');
    expect(fixture.nativeElement.textContent).toContain('EM_EXECUCAO');
    expect(fixture.nativeElement.textContent).toContain('Parachoque Dianteiro');
    expect(fixture.nativeElement.querySelector('[data-testid="vistoria-foto"]')?.getAttribute('src'))
      .toBe('https://cdn.lavame.test/vistoria/11.jpg');
  });

  it('deve manter botao resolver desabilitado enquanto a nota estiver vazia', async () => {
    await criarComponente();

    fixture.nativeElement.querySelector('[data-testid="incidente-card"]').click();
    fixture.detectChanges();

    const resolverButton = fixture.nativeElement.querySelector('[data-testid="resolver-button"]') as HTMLButtonElement;
    expect(resolverButton.disabled).toBe(true);
  });

  it('deve resolver incidente, fechar modal e atualizar a lista', async () => {
    incidentesServiceSpy.listarPendentes
      .mockReturnValueOnce(of(mockIncidentes))
      .mockReturnValueOnce(of([]));

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

    expect(component.resolvendo).toBe(false);
    expect(component.modalAberto).toBe(false);
    expect(component.incidentes.length).toBe(0);
    expect(component.mensagemSucesso).toContain('OS #1024 liberada com sucesso.');
    expect(incidentesServiceSpy.listarPendentes).toHaveBeenCalledTimes(2);
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
      throwError(() => ({ error: { detail: 'O incidente informado já foi resolvido.' } })),
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
    expect(component.erroResolucao).toBe('O incidente informado já foi resolvido.');
    expect(fixture.nativeElement.textContent).toContain('O incidente informado já foi resolvido.');
  });
});
