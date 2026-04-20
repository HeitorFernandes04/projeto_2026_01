import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HistoricoService } from '../../services/historico.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-historico',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  templateUrl: './historico.component.html',
  styleUrl: './historico.component.scss'
})
export class HistoricoComponent implements OnInit {
  // Variáveis para controle do Custom Select
  dropdownAberto = false;
  selectedStatus = 'Todos';
  statusOptions = ['Todos', 'Finalizado', 'Cancelado'];

  ordensFinalizadas: any[] = [];
  
  // Filtros
  placaFiltro: string = '';
  dataFiltro: string = '';

  constructor(
    private router: Router,
    private historicoService: HistoricoService,
    private datePipe: DatePipe
  ) {}

  ngOnInit() {
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    let dataInicioStr = '';
    
    // Tratamento basico da data para YYYY-MM-DD
    if (this.dataFiltro) {
      const parts = this.dataFiltro.split('/');
      if (parts.length === 3) {
        dataInicioStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    const filtros = {
      placa: this.placaFiltro,
      status: this.selectedStatus,
      data_inicio: dataInicioStr,
      data_fim: dataInicioStr // usando a mesma data para o filtro simples do prototipo
    };

    this.historicoService.buscarHistorico(filtros).subscribe({
      next: (res) => {
        this.ordensFinalizadas = res.results || res; // Suporta paginação ou array direto
      },
      error: (err) => {
        console.error('Erro ao buscar histórico', err);
      }
    });
  }

  onFiltroChange(campo: string, evento: any) {
    if (campo === 'placa') this.placaFiltro = evento.target.value;
    if (campo === 'data') this.dataFiltro = evento.target.value;
  }

  toggleDropdown() {
    this.dropdownAberto = !this.dropdownAberto;
  }

  selectOption(option: string) {
    this.selectedStatus = option;
    this.dropdownAberto = false;
    this.aplicarFiltros();
  }

  visualizarDossie(osId: string) {
    this.router.navigate(['/gestao/dossie']);
  }

  irParaIncidentes() {
    this.router.navigate(['/gestao/incidentes']);
  }
}
