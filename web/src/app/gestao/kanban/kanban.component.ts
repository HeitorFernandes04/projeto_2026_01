import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { KanbanService, KanbanCard, KanbanData } from '../../services/kanban.service';
import { IncidentesService } from '../../services/incidentes.service';
import { Subscription } from 'rxjs';

interface ColunaConfig {
  chave: keyof KanbanData;
  nome: string;
  linhaClass: string;
}

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kanban.component.html',
  styleUrl: './kanban.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanComponent implements OnInit, OnDestroy {

  readonly COLUNAS_CONFIG: ColunaConfig[] = [
    { chave: 'PATIO',           nome: 'PÁTIO',              linhaClass: 'gray'   },
    { chave: 'LAVAGEM',         nome: 'LAVAGEM / AUDITORIA', linhaClass: 'blue'   },
    { chave: 'FINALIZADO_HOJE', nome: 'FINALIZADOS HOJE',   linhaClass: 'green'  },
    { chave: 'INCIDENTES',      nome: 'INCIDENTES',         linhaClass: 'red'    },
  ];

  kanban: KanbanData = { PATIO: [], LAVAGEM: [], FINALIZADO_HOJE: [], INCIDENTES: [] };
  carregando = true;
  erro = false;
  totalIncidentesPendentes = 0;

  private intervalo?: ReturnType<typeof setInterval>;
  private tickingInterval?: ReturnType<typeof setInterval>;
  private readonly subscriptions = new Subscription();

  get dataHoje(): string {
    return new Date()
      .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
      .replaceAll('.', '')
      .toUpperCase();
  }

  get totalEmOperacao(): number {
    return Object.values(this.kanban).reduce((acc, col) => acc + col.length, 0);
  }

  get tempoMedioMinutos(): number {
    const todos = Object.values(this.kanban).flat();
    if (!todos.length) return 0;
    return Math.round(todos.reduce((acc, c) => acc + c.tempo_decorrido_minutos, 0) / todos.length);
  }

  get eficienciaPercent(): number {
    const todos = Object.values(this.kanban).flat();
    if (!todos.length) return 100;
    return Math.round((todos.filter(c => !c.is_atrasado).length / todos.length) * 100);
  }

  constructor(
    private readonly router: Router,
    private readonly kanbanService: KanbanService,
    private readonly incidentesService: IncidentesService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.monitorarIncidentesPendentes();
    this.carregarKanban();
    this.intervalo = setInterval(() => this.carregarKanban(), 30000);
    this.tickingInterval = setInterval(() => this.tickSegundos(), 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalo);
    clearInterval(this.tickingInterval);
    this.incidentesService.pararMonitoramentoPendentes();
    this.subscriptions.unsubscribe();
  }

  private tickSegundos(): void {
    let mudou = false;
    if (this.kanban.LAVAGEM && this.kanban.LAVAGEM.length > 0) {
      this.kanban.LAVAGEM.forEach(card => {
        if (!card.is_pausado) {
          if (card.tempo_decorrido_segundos !== undefined) {
            card.tempo_decorrido_segundos++;
          } else {
            card.tempo_decorrido_segundos = (card.tempo_decorrido_minutos * 60) + 1;
          }
          card.tempo_decorrido_minutos = Math.floor(card.tempo_decorrido_segundos / 60);
          
          if (card.tempo_decorrido_minutos > card.duracao_estimada_minutos) {
            card.is_atrasado = true;
          }
          mudou = true;
        }
      });
    }
    if (mudou) {
      this.cdr.markForCheck();
    }
  }

  private monitorarIncidentesPendentes(): void {
    this.subscriptions.add(
      this.incidentesService.totalPendentes$.subscribe((total) => {
        this.totalIncidentesPendentes = total;
        this.cdr.markForCheck();
      }),
    );
    this.incidentesService.iniciarMonitoramentoPendentes();
  }

  carregarKanban(): void {
    this.kanbanService.obterKanban().subscribe({
      next: (data) => {
        this.kanban = data;
        this.carregando = false;
        this.erro = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.carregando = false;
        this.erro = true;
        this.cdr.markForCheck();
      }
    });
  }

  cardsDeColuna(chave: keyof KanbanData): KanbanCard[] {
    return this.kanban[chave] ?? [];
  }

  formatarTempo(segundos: number): string {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  calcularProgresso(card: KanbanCard): number {
    if (!card.duracao_estimada_minutos) return 0;
    const duracaoSegundos = card.duracao_estimada_minutos * 60;
    const decorridoSegundos = card.tempo_decorrido_segundos ?? (card.tempo_decorrido_minutos * 60);
    return Math.min((decorridoSegundos / duracaoSegundos) * 100, 100);
  }

  irParaIncidentes(): void {
    this.router.navigate(['/gestao/incidentes']);
  }
}
