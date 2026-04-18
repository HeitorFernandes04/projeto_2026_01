import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dossie',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dossie.component.html',
  styleUrl: './dossie.component.scss'
})
export class DossieComponent {
  constructor(private router: Router) {}
  // Dados simulados baseados nos seus prints de vistoria
  dossie = {
    os: 'OS-001234',
    data: '14/04/2026',
    placa: 'ABC-1234',
    modelo: 'Toyota Corolla - Prata',
    cliente: 'João Silva',
    servicos: [
      { nome: 'Lavagem Completa', preco: 80.00 },
      { nome: 'Cera Protetora', preco: 40.00 }
    ],
    fotosEntrada: [
      'assets/vistoria/entrada_1.jpg',
      'assets/vistoria/entrada_2.jpg'
    ],
    fotosSaida: [
      'assets/vistoria/saida_1.jpg'
    ],
    total: 120.00
  };

  voltar() {
    window.history.back();
  }

  irParaIncidentes() {
    this.router.navigate(['/gestao/incidentes']);
  }
}
