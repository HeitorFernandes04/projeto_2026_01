import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdemServicoService, OrdemServico } from '../../services/ordem-servico.service';

@Component({
  selector: 'app-card-ativo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-ativo.component.html',
  styleUrls: ['./card-ativo.component.scss']
})
export class CardAtivoComponent {
  @Input() ativo!: OrdemServico;

  /** RF-24: Notifica o painel pai para remover o card após cancelamento bem-sucedido. */
  @Output() cancelado = new EventEmitter<number>();

  private ordemServicoService = inject(OrdemServicoService);

  cancelando = false;
  erroCancelamento = '';

  /**
   * RF-24.1 + RF-24.3: Só exibe o botão se a OS está em PATIO e possui slug (UUID).
   * OS iniciadas (VISTORIA_INICIAL em diante) não permitem cancelamento.
   */
  get podeCancelar(): boolean {
    return this.ativo?.status === 'PATIO' && !!this.ativo?.slug_cancelamento;
  }

  /**
   * RF-24: Envia PATCH via slug_cancelamento (nunca ID sequencial).
   * Emite evento (cancelado) para que o painel pai remova o card da lista.
   */
  cancelarAgendamento(): void {
    if (!this.podeCancelar || this.cancelando) return;

    this.cancelando = true;
    this.erroCancelamento = '';

    this.ordemServicoService
      .cancelarAgendamento(this.ativo.slug_cancelamento!)
      .subscribe({
        next: () => {
          this.cancelando = false;
          this.cancelado.emit(this.ativo.id);
        },
        error: (err) => {
          this.cancelando = false;
          this.erroCancelamento =
            err.error?.detail ?? 'Não foi possível cancelar. Tente novamente.';
        },
      });
  }
}
