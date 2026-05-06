import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdemServicoService } from '../../services/ordem-servico.service';
import { OrdemServicoCliente } from '../../../../services/painel-cliente.service';

@Component({
  selector: 'app-card-ativo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-ativo.component.html',
  styleUrls: ['./card-ativo.component.scss']
})
export class CardAtivoComponent {
  @Input() ativo!: OrdemServicoCliente;

  /** RF-24: Notifica o painel pai para remover o card após cancelamento bem-sucedido. */
  @Output() cancelado = new EventEmitter<number>();

  private ordemServicoService = inject(OrdemServicoService);

  aguardandoConfirmacao = false;
  cancelando = false;
  erroCancelamento = '';

  get podeCancelar(): boolean {
    return this.ativo?.status === 'PATIO' && !!this.ativo?.slug_cancelamento;
  }

  pedirConfirmacao(): void {
    if (!this.podeCancelar || this.cancelando) return;
    this.aguardandoConfirmacao = true;
    this.erroCancelamento = '';
  }

  cancelarConfirmacao(): void {
    this.aguardandoConfirmacao = false;
  }

  cancelarAgendamento(): void {
    if (!this.podeCancelar || this.cancelando) return;

    this.cancelando = true;
    this.erroCancelamento = '';

    this.ordemServicoService
      .cancelarAgendamento(this.ativo.slug_cancelamento!)
      .subscribe({
        next: () => {
          this.cancelando = false;
          this.aguardandoConfirmacao = false;
          this.cancelado.emit(this.ativo.id);
        },
        error: (err) => {
          this.cancelando = false;
          this.aguardandoConfirmacao = false;
          this.erroCancelamento =
            err.error?.detail ?? 'Não foi possível cancelar. Tente novamente.';
        },
      });
  }
}
