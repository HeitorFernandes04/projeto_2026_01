import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IncidenteOS, IncidenteService } from '../../services/incidente.service';

@Component({
  selector: 'app-incidentes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incidentes.component.html',
  styleUrl: './incidentes.component.scss'
})
export class IncidentesComponent implements OnInit {
  incidentes: IncidenteOS[] = [];
  incidenteSelecionado: IncidenteOS | null = null;
  modalAberto = false;

  carregando = false;
  auditoriaCarregando = false;
  salvandoResolucao = false;

  erro = '';
  erroResolucao = '';
  notaResolucao = '';

  constructor(private incidenteService: IncidenteService) {}

  ngOnInit(): void {
    this.carregarPendentes();
  }

  get temPendencias(): boolean {
    return this.incidentes.length > 0;
  }

  carregarPendentes(): void {
    this.carregando = true;
    this.erro = '';

    this.incidenteService.listarPendentes().subscribe({
      next: incidentes => {
        this.incidentes = incidentes;
        this.carregando = false;
      },
      error: () => {
        this.incidentes = [];
        this.erro = 'Não foi possível carregar os incidentes pendentes.';
        this.carregando = false;
      },
    });
  }

  abrirModal(incidente: IncidenteOS): void {
    this.modalAberto = true;
    this.incidenteSelecionado = incidente;
    this.notaResolucao = '';
    this.erroResolucao = '';
    this.auditoriaCarregando = true;

    this.incidenteService.obterAuditoria(incidente.id).subscribe({
      next: auditoria => {
        this.incidenteSelecionado = auditoria;
        this.auditoriaCarregando = false;
      },
      error: () => {
        this.erroResolucao = 'Não foi possível carregar a auditoria do incidente.';
        this.auditoriaCarregando = false;
      },
    });
  }

  fecharModal(): void {
    if (this.salvandoResolucao) {
      return;
    }

    this.modalAberto = false;
    this.incidenteSelecionado = null;
    this.notaResolucao = '';
    this.erroResolucao = '';
  }

  resolverIncidente(): void {
    if (!this.incidenteSelecionado) {
      return;
    }

    const nota = this.notaResolucao.trim();
    if (!nota) {
      this.erroResolucao = 'A nota de resolução é obrigatória.';
      return;
    }

    this.salvandoResolucao = true;
    this.erroResolucao = '';

    this.incidenteService.resolver(this.incidenteSelecionado.id, nota).subscribe({
      next: () => {
        this.salvandoResolucao = false;
        this.fecharModal();
        this.carregarPendentes();
      },
      error: error => {
        this.erroResolucao = error?.error?.detail || 'Não foi possível resolver o incidente.';
        this.salvandoResolucao = false;
      },
    });
  }

  formatarData(data: string | null): string {
    if (!data) {
      return '-';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(data));
  }
}
