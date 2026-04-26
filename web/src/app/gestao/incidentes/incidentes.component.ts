import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IncidenteAuditoria,
  IncidentePendente,
  IncidentesService,
} from '../../services/incidentes.service';


@Component({
  selector: 'app-incidentes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incidentes.component.html',
  styleUrl: './incidentes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentesComponent implements OnInit, OnDestroy {
  carregando = true;
  erro = false;
  modalAberto = false;
  carregandoAuditoria = false;
  erroAuditoria = false;
  resolvendo = false;
  erroResolucao = '';
  mensagemSucesso = '';
  notaResolucao = '';
  incidentes: IncidentePendente[] = [];
  incidenteSelecionado: IncidentePendente | null = null;
  auditoriaSelecionada: IncidenteAuditoria | null = null;

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

  get podeResolver(): boolean {
    return !!this.incidenteSelecionado && this.notaResolucao.trim().length > 0 && !this.resolvendo;
  }

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
    this.carregandoAuditoria = true;
    this.erroAuditoria = false;
    this.erroResolucao = '';
    this.notaResolucao = '';
    this.auditoriaSelecionada = null;
    this.mensagemSucesso = '';
    this.carregarAuditoria(incidente.id);
    this.cdr.markForCheck();
  }

  fecharModal(): void {
    this.modalAberto = false;
    this.incidenteSelecionado = null;
    this.auditoriaSelecionada = null;
    this.carregandoAuditoria = false;
    this.erroAuditoria = false;
    this.resolvendo = false;
    this.erroResolucao = '';
    this.notaResolucao = '';
    this.cdr.markForCheck();
  }

  carregarAuditoria(incidenteId: number): void {
    this.carregandoAuditoria = true;
    this.erroAuditoria = false;

    this.incidentesService.obterAuditoria(incidenteId).subscribe({
      next: (auditoria) => {
        this.auditoriaSelecionada = auditoria;
        this.carregandoAuditoria = false;
        this.erroAuditoria = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.auditoriaSelecionada = null;
        this.carregandoAuditoria = false;
        this.erroAuditoria = true;
        this.cdr.markForCheck();
      },
    });
  }

  resolverIncidente(): void {
    if (!this.incidenteSelecionado || !this.notaResolucao.trim()) {
      return;
    }

    this.resolvendo = true;
    this.erroResolucao = '';

    this.incidentesService
      .resolverIncidente(this.incidenteSelecionado.id, this.notaResolucao.trim())
      .subscribe({
        next: () => {
          const ordemServicoId = this.incidenteSelecionado?.ordem_servico_id;
          this.resolvendo = false;
          this.mensagemSucesso = `Incidente resolvido e OS #${ordemServicoId} liberada com sucesso.`;
          this.fecharModal();
          this.carregarIncidentes(false);
          this.cdr.markForCheck();
        },
        error: (error: { error?: { detail?: string } }) => {
          this.resolvendo = false;
          this.erroResolucao = error.error?.detail ?? 'Nao foi possivel resolver o incidente.';
          this.cdr.markForCheck();
        },
      });
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
