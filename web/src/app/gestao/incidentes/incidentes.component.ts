import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IncidentePendente, IncidentesService } from '../../services/incidentes.service';


@Component({
  selector: 'app-incidentes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './incidentes.component.html',
  styleUrl: './incidentes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentesComponent implements OnInit, OnDestroy {
  carregando = true;
  erro = false;
  modalAberto = false;
  incidentes: IncidentePendente[] = [];
  incidenteSelecionado: IncidentePendente | null = null;

  private intervalo?: ReturnType<typeof setInterval>;

  get hojeStr(): string {
    const data = new Date();
    return data
      .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
      .replaceAll('.', '')
      .toUpperCase();
  }

  get totalPendentes(): number {
    return this.incidentes.length;
  }

  constructor(
    private readonly incidentesService: IncidentesService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.carregarIncidentes(true);
    this.intervalo = setInterval(() => this.carregarIncidentes(false), 30000);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalo);
  }

  carregarIncidentes(exibirLoading = true): void {
    if (exibirLoading) {
      this.carregando = true;
    }

    this.incidentesService.listarPendentes().subscribe({
      next: (incidentes) => {
        this.incidentes = incidentes;
        this.carregando = false;
        this.erro = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.carregando = false;
        this.erro = true;
        this.cdr.markForCheck();
      },
    });
  }

  abrirModal(incidente: IncidentePendente): void {
    this.incidenteSelecionado = incidente;
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
    this.incidenteSelecionado = null;
  }

  formatarDataHora(dataIso: string): string {
    return new Date(dataIso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
