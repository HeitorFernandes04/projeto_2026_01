import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { KanbanService, KanbanCard, KanbanData } from '../../services/kanban.service';

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
    { chave: 'PATIO',          nome: 'PÁTIO',               linhaClass: 'gray'   },
    { chave: 'VISTORIA_INICIAL', nome: 'VISTORIA',           linhaClass: 'purple' },
    { chave: 'EM_EXECUCAO',    nome: 'LAVAGEM / ACABAMENTO', linhaClass: 'blue'   },
    { chave: 'LIBERACAO',      nome: 'LIBERAÇÃO',            linhaClass: 'cyan'   },
  ];

  kanban: KanbanData = { PATIO: [], VISTORIA_INICIAL: [], EM_EXECUCAO: [], LIBERACAO: [] };
  carregando = true;
  erro = false;

  private intervalo?: ReturnType<typeof setInterval>;

  get dataHoje(): string {
    const d = new Date();
    const meses = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
    return `${String(d.getDate()).padStart(2, '0')} ${meses[d.getMonth()]} ${d.getFullYear()}`;
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
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.carregarKanban();
    this.intervalo = setInterval(() => this.carregarKanban(), 30000);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalo);
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

  formatarTempo(minutos: number): string {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  calcularProgresso(card: KanbanCard): number {
    if (!card.duracao_estimada_minutos) return 0;
    return Math.min((card.tempo_decorrido_minutos / card.duracao_estimada_minutos) * 100, 100);
  }

  irParaIncidentes(): void {
    this.router.navigate(['/gestao/incidentes']);
  }
}
