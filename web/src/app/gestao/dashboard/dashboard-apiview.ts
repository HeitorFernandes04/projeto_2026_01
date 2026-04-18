import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-apiview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-apiview.html',
  styleUrl: './dashboard-apiview.component.scss'
})
export class DashboardAPIView {
  constructor(private router: Router) {}

  // Mock de dados baseado no protótipo enviado
  topServicos = [
    { nome: 'Lavagem Completa', vendas: 87, valor: '5.220', percentual: 100 },
    { nome: 'Lavagem + Polimento', vendas: 45, valor: '6.750', percentual: 75 },
    { nome: 'Lavagem Expressa', vendas: 62, valor: '2.170', percentual: 60 },
    { nome: 'Lavagem + Enceramento', vendas: 28, valor: '2.660', percentual: 40 },
    { nome: 'Lavagem Premium', vendas: 12, valor: '2.400', percentual: 20 }
  ];

  irParaIncidentes() {
    this.router.navigate(['/gestao/incidentes']);
  }
}
