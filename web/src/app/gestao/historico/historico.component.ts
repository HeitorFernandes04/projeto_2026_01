import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-historico',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historico.component.html',
  styleUrl: './historico.component.scss'
})
export class HistoricoComponent {
  // Variáveis para controle do Custom Select
  dropdownAberto = false;
  selectedStatus = 'Todos';
  statusOptions = ['Todos', 'Finalizado', 'Cancelado'];

  // Mock de dados para a tabela conforme o protótipo
  ordensFinalizadas = [
    {
      os: 'OS-001234',
      dataHora: '14 ABR 2026 - 14:30',
      placa: 'ABC-1234',
      cliente: 'João Silva',
      servico: 'Lavagem Completa',
      status: 'FINALIZADO'
    },
    {
      os: 'OS-001235',
      dataHora: '14 ABR 2026 - 15:15',
      placa: 'XYZ-5678',
      cliente: 'Maria Souza',
      servico: 'Lavagem + Polimento',
      status: 'FINALIZADO'
    }
  ];

  constructor(private router: Router) {}

  toggleDropdown() {
    this.dropdownAberto = !this.dropdownAberto;
  }

  selectOption(option: string) {
    this.selectedStatus = option;
    this.dropdownAberto = false;
  }

  visualizarDossie(osId: string) {
    this.router.navigate(['/gestao/dossie']);
  }

  irParaIncidentes() {
    this.router.navigate(['/gestao/incidentes']);
  }
}
