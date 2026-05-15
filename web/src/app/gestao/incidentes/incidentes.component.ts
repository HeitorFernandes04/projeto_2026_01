import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import {
  IncidenteAuditoria,
  IncidenteComparativo,
  IncidentePendente,
  IncidentesService,
  MidiaComparativoIncidente,
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
  comparativoSelecionado: IncidenteComparativo | null = null;
  fotoAmpliada: { url: string; alt: string } | null = null;

  private readonly incidentesService = inject(IncidentesService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly subscriptions = new Subscription();

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

  get podeResolver(): boolean {
    return !!this.incidenteSelecionado && this.notaResolucao.trim().length > 0 && !this.resolvendo;
  }

  fotosEntradaComparativo(): MidiaComparativoIncidente[] {
    return this.comparativoSelecionado?.entrada ?? [];
  }

  fotosIncidenteComparativo(): MidiaComparativoIncidente[] {
    return this.comparativoSelecionado?.incidente ?? [];
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.incidentesService.pendentes$.subscribe((incidentes) => {
        this.incidentes = incidentes;
        this.cdr.markForCheck();
      }),
    );

    this.incidentesService.iniciarMonitoramentoPendentes();
    this.carregarIncidentes(true);
  }

  ngOnDestroy(): void {
    this.incidentesService.pararMonitoramentoPendentes();
    this.subscriptions.unsubscribe();
  }

  carregarIncidentes(exibirLoading = true): void {
    if (exibirLoading) {
      this.carregando = true;
    }

    this.incidentesService.recarregarPendentes().subscribe({
      next: () => {
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
    this.comparativoSelecionado = null;
    this.mensagemSucesso = '';
    this.carregarAuditoria(incidente.id);
    this.carregarComparativo(incidente.id);
    this.cdr.markForCheck();
  }

  fecharModal(): void {
    this.modalAberto = false;
    this.incidenteSelecionado = null;
    this.auditoriaSelecionada = null;
    this.comparativoSelecionado = null;
    this.carregandoAuditoria = false;
    this.erroAuditoria = false;
    this.resolvendo = false;
    this.erroResolucao = '';
    this.notaResolucao = '';
    this.fotoAmpliada = null;
    this.cdr.markForCheck();
  }

  abrirFotoAmpliada(url: string | null, alt: string): void {
    if (!url) {
      return;
    }

    this.fotoAmpliada = { url, alt };
    this.cdr.markForCheck();
  }

  fecharFotoAmpliada(): void {
    this.fotoAmpliada = null;
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

  carregarComparativo(incidenteId: number): void {
    this.incidentesService.obterComparativo(incidenteId).subscribe({
      next: (comparativo) => {
        this.comparativoSelecionado = comparativo;
        this.cdr.markForCheck();
      },
      error: () => {
        this.comparativoSelecionado = {
          entrada: [],
          incidente: [],
          ordem_servico: {
            id: this.incidenteSelecionado?.ordem_servico_id ?? incidenteId,
            placa: this.incidenteSelecionado?.placa ?? '',
            modelo: this.incidenteSelecionado?.modelo ?? '',
          },
        };
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

  formatarStatusOrdem(status: string): string {
    const mapa: Record<string, string> = {
      BLOQUEADO_INCIDENTE: 'Em analise',
      EM_EXECUCAO: 'Em execucao',
      LIBERACAO: 'Liberacao',
      PATIO: 'Patio',
      VISTORIA_INICIAL: 'Vistoria inicial',
      FINALIZADO: 'Finalizado',
      CANCELADO: 'Cancelado',
    };

    return mapa[status] ?? status;
  }
}
