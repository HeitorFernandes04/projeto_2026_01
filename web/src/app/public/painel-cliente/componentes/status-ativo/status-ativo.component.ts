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
    if (!this.ativo) return 'Veículo Recebido';
    
    const mapa: { [key: string]: string } = {
      'PATIO': 'Veículo Recebido',
      'VISTORIA_INICIAL': 'Check-list em andamento',
      'EM_EXECUCAO': 'Limpando seu veículo',
      'LIBERACAO': 'Pronto para retirada',
      'FINALIZADO': 'Serviço concluído'
    };
    return mapa[this.ativo.status] || 'Veículo Recebido';
  }

  getEtapaIndex(): number {
    if (!this.ativo) return 0; // Sem serviço ativo = primeira etapa
    // Mapeia o status vindo da API para o índice do progresso (0 a 3)
    const mapa: { [key: string]: number } = {
      'PATIO': 0,
      'VISTORIA_INICIAL': 1,
      'EM_EXECUCAO': 2,
      'LIBERACAO': 3,
      'FINALIZADO': 3
    };
    return mapa[this.ativo.status] || 0;
  }

  getProgressoBarra(): number {
    const index = this.getEtapaIndex();
    return (index / (this.etapas.length - 1)) * 100;
  }

  cancelarAgendamento(): void {
    if (this.ativo) {
      // Emitir evento para o componente pai tratar o cancelamento
      console.log('Cancelar agendamento:', this.ativo);
      // Aqui você pode usar @Output para comunicar com o componente pai
    } else {
      console.log('Nenhum serviço ativo para cancelar');
    }
  }
}
