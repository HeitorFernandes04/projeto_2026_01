import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card-ativo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-ativo.component.html',
  styleUrls: ['./card-ativo.component.scss']
})
export class CardAtivoComponent {
  @Input() ativo: any;

  /**
   * Cancela o agendamento do serviço
   */
  cancelarAgendamento(): void {
    console.log('Cancelar agendamento:', this.ativo?.id);
    // Lógica para cancelar agendamento
  }
}
