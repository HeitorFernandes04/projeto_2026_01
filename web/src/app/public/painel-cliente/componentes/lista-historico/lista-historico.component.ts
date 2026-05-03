import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lista-historico',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-historico.component.html',
  styleUrls: ['./lista-historico.component.scss']
})
export class ListaHistoricoComponent {
  @Input() historico: any[] = [];

  verDossie(id: number): void {
    console.log('Navegando para o dossiê da OS:', id);
    // Lógica de navegação para a galeria de fotos (RF-26)[cite: 2]
  }
}