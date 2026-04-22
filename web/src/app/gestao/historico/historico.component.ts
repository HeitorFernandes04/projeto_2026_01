import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  HistoricoService,
  HistoricoItem,
  HistoricoFiltros,
} from '../../services/historico.service';

@Component({
  selector: 'app-historico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historico.component.html',
  styleUrl: './historico.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricoComponent implements OnInit {
  ordens: HistoricoItem[] = [];
  carregando = true;
  erro = false;
  erroDatas = '';

  totalItens = 0;
  paginaAtual = 1;
  readonly itensPorPagina = 15;

  // Filtros ligados ao template via ngModel
  filtroPlaca = '';
  filtroStatus = '';
  filtroDataInicio = '';
  filtroDataFim = '';
  filtroComIncidenteResolvido = false;

  // Custom select de status — apenas estados terminais (histórico = OS encerradas)
  dropdownAberto = false;
  selectedStatus = 'Todos';
  readonly statusOptions = ['Todos', 'FINALIZADO', 'CANCELADO'];

  get totalPaginas(): number {
    return Math.ceil(this.totalItens / this.itensPorPagina);
  }

  get dataHoje(): string {
    const d = new Date();
    const meses = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
    return `${String(d.getDate()).padStart(2,'0')} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }

  constructor(
    private readonly router: Router,
    private readonly historicoService: HistoricoService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.buscar();
  }

  buscar(pagina = 1): void {
    this.erroDatas = '';
    this.carregando = true;
    this.paginaAtual = pagina;
    this.cdr.markForCheck();

    const filtros: HistoricoFiltros = { page: pagina };
    if (this.filtroPlaca.trim())          filtros.placa                    = this.filtroPlaca.replace('-', '').trim();
    if (this.filtroDataInicio)            filtros.data_inicio               = this.filtroDataInicio;
    if (this.filtroDataFim)               filtros.data_fim                  = this.filtroDataFim;
    if (this.filtroStatus)                filtros.status                    = this.filtroStatus;
    if (this.filtroComIncidenteResolvido) filtros.com_incidente_resolvido   = true;

    this.historicoService.buscarHistorico(filtros).subscribe({
      next: (res) => {
        this.ordens     = res.results;
        this.totalItens = res.count;
        this.carregando = false;
        this.erro       = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.carregando = false;
        this.erro       = true;
        if (err.status === 400 && err.error?.detail) {
          this.erroDatas = err.error.detail;
        }
        this.cdr.markForCheck();
      },
    });
  }

  limparFiltros(): void {
    this.filtroPlaca                  = '';
    this.filtroDataInicio             = '';
    this.filtroDataFim                = '';
    this.filtroStatus                 = '';
    this.selectedStatus               = 'Todos';
    this.filtroComIncidenteResolvido  = false;
    this.buscar();
  }

  formatarPlacaInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7);
    if (v.length > 3) v = `${v.slice(0, 3)}-${v.slice(3)}`;
    this.filtroPlaca = v;
    input.value = v;
  }

  mudarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.buscar(pagina);
  }

  // Custom select
  toggleDropdown(): void {
    this.dropdownAberto = !this.dropdownAberto;
  }

  selectOption(option: string): void {
    this.selectedStatus = option;
    this.filtroStatus   = option === 'Todos' ? '' : option;
    this.dropdownAberto = false;
  }

  visualizarDossie(osId: number): void {
    this.router.navigate(['/gestao/dossie', osId]);
  }

  irParaIncidentes(): void {
    this.router.navigate(['/gestao/incidentes']);
  }

  formatarData(iso: string): string {
    if (!iso) return '-';
    const d = new Date(iso);
    const meses = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
    return `${String(d.getDate()).padStart(2,'0')} ${meses[d.getMonth()]} ${d.getFullYear()} - ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  statusLabel(status: string): string {
    const mapa: Record<string, string> = {
      FINALIZADO: 'Finalizado',
      CANCELADO: 'Cancelado',
      PATIO: 'Pátio',
      VISTORIA_INICIAL: 'Vistoria',
      EM_EXECUCAO: 'Em Execução',
      LIBERACAO: 'Liberação',
      BLOQUEADO_INCIDENTE: 'Incidente',
    };
    return mapa[status] ?? status;
  }

  statusClass(status: string): string {
    const mapa: Record<string, string> = {
      FINALIZADO: 'pill-green',
      CANCELADO: 'pill-red',
      BLOQUEADO_INCIDENTE: 'pill-orange',
    };
    return mapa[status] ?? 'pill-gray';
  }
}
