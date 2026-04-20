import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IncidenteService } from '../../services/incidente.service';

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kanban.component.html',
  styleUrl: './kanban.component.scss'
})
export class KanbanComponent {
  incidentesPendentes = 0;

  constructor(private router: Router, private incidenteService?: IncidenteService) {}

ngOnInit() {
  this.incidenteService?.listarPendentes().subscribe({
    next: incidentes => {
      this.incidentesPendentes = incidentes.length;
    },
    error: () => {
      this.incidentesPendentes = 0;
    },
  });
}
colunas = [
  {
    nome: 'PÁTIO',
    cor: '#007bff',
    cards: [
      { placa: 'ABC-1234', modelo: 'Toyota Corolla', servico: 'Lavagem Completa', tempo: '15min', status: 'em-espera', alerta: false }, // Adicionado alerta: false
      { placa: 'KJG-9988', modelo: 'Honda Civic', servico: 'Ducha', tempo: '5min', status: 'em-espera', alerta: false } // Adicionado alerta: false
    ]
  },
  {
    nome: 'VISTORIA',
    cor: '#6610f2',
    cards: [
      { placa: 'XYZ-5678', modelo: 'Fiat Toro', servico: 'Polimento', tempo: '25min', status: 'em-analise', alerta: false } // Adicionado alerta: false
    ]
  },
  {
    nome: 'LAVAGEM / ACABAMENTO',
    cor: '#fd7e14',
    cards: [
      { placa: 'DEF-9012', modelo: 'Jeep Compass', servico: 'Higienização', tempo: '45min', status: 'atrasado', alerta: true }
    ]
  },
  {
    nome: 'LIBERAÇÃO',
    cor: '#28a745',
    cards: [
      { placa: 'GHI-1122', modelo: 'VW Golf', servico: 'Lavagem Completa', tempo: '60min', status: 'pronto', alerta: false } // Adicionado alerta: false
    ]
  }
];

irParaIncidentes() {
  this.router.navigate(['/gestao/incidentes']);
}
}
