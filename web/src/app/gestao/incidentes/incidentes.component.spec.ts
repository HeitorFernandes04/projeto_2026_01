import '@angular/compiler';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { IncidentePendente, IncidentesService } from '../../services/incidentes.service';
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
  {
    id: 12,
    ordem_servico_id: 1028,
    status_ordem_servico: 'BLOQUEADO_INCIDENTE',
    placa: 'KLT-4412',
    modelo: 'Toyota Hilux',
    servico: 'Higienizacao',
    tag_peca: 'Porta Traseira',
    descricao: 'Avaria identificada durante a execucao.',
    foto_url: 'https://cdn.lavame.test/incidentes/12.jpg',
    data_registro: '2026-04-26T13:10:00Z',
  },
];


describe('IncidentesComponent - RF-15', () => {
  let fixture: ComponentFixture<IncidentesComponent>;
  let component: IncidentesComponent;
  let incidentesServiceSpy: { listarPendentes: ReturnType<typeof vi.fn> };

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

    const cards = fixture.nativeElement.querySelectorAll('[data-testid="incidente-card"]');
    const badge = fixture.nativeElement.querySelector('[data-testid="badge-count"]');

    expect(cards.length).toBe(2);
    expect(badge?.textContent?.trim()).toBe('2');
    expect(fixture.nativeElement.textContent).toContain('BRA-2E19');
    expect(fixture.nativeElement.textContent).toContain('Toyota Hilux');
  });

  it('deve renderizar estado vazio quando nao houver pendencias', async () => {
    incidentesServiceSpy.listarPendentes.mockReturnValue(of([]));

    await criarComponente();

    expect(component.incidentes).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('Nenhum incidente pendente no momento.');
  });

  it('deve renderizar erro e permitir nova tentativa', async () => {
    incidentesServiceSpy.listarPendentes.mockReturnValueOnce(
      throwError(() => new Error('500')),
    );

    await criarComponente();

    expect(component.erro).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Nao foi possivel carregar a central de incidentes.');

    incidentesServiceSpy.listarPendentes.mockReturnValue(of(mockIncidentes));
    fixture.nativeElement.querySelector('[data-testid="retry-button"]').click();
    fixture.detectChanges();

    expect(incidentesServiceSpy.listarPendentes).toHaveBeenCalledTimes(2);
    expect(component.erro).toBe(false);
    expect(component.incidentes.length).toBe(2);
  });

  it('deve abrir modal com dados reais do incidente selecionado', async () => {
    await criarComponente();

    fixture.nativeElement.querySelector('[data-testid="incidente-card"]').click();
    fixture.detectChanges();

    expect(component.modalAberto).toBe(true);
    expect(component.incidenteSelecionado?.id).toBe(11);
    expect(fixture.nativeElement.textContent).toContain('Parachoque Dianteiro');
    expect(fixture.nativeElement.textContent).toContain('Cliente reportou divergencia visual no para-choque.');

    const image = fixture.nativeElement.querySelector('[data-testid="incidente-foto"]');
    const resolverButton = fixture.nativeElement.querySelector('[data-testid="resolver-button"]');

    expect(image?.getAttribute('src')).toBe('https://cdn.lavame.test/incidentes/11.jpg');
    expect(resolverButton?.disabled).toBe(true);
    expect(resolverButton?.textContent).toContain('RF-16');
  });

  it('deve fechar modal ao acionar o botao de fechar', async () => {
    await criarComponente();

    fixture.nativeElement.querySelector('[data-testid="incidente-card"]').click();
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[aria-label="Fechar detalhes do incidente"]').click();
    fixture.detectChanges();

    expect(component.modalAberto).toBe(false);
    expect(component.incidenteSelecionado).toBeNull();
  });
});
