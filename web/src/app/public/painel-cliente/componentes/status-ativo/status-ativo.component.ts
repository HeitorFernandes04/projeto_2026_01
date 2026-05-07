import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-ativo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-ativo.component.html',
  styleUrls: ['./status-ativo.component.scss']
})
export class StatusAtivoComponent {
  @Input() ativo: any;

  etapas = [
    { label: 'Veículo Recebido' },
    { label: 'Check-list' },
    { label: 'Limpando' },
    { label: 'Pronto para Retirar' }
  ];

  getStatusText(): string {
    return this.ativo?.status_display || 'Veículo Recebido';
  }

  getEtapaIndex(): number {
    // etapa_atual vem da API como 1–4; índice do stepper é 0–3
    // Math.max garante que CANCELADO (etapa_atual=0) não gere índice negativo
    return Math.max(0, (this.ativo?.etapa_atual ?? 1) - 1);
  }

  getProgressoBarra(): number {
    const index = this.getEtapaIndex();
    return (index / (this.etapas.length - 1)) * 100;
  }

}