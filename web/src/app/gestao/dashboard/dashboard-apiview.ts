import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { DashboardService, EficienciaFuncionario, Indicadores } from '../../services/dashboard.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-apiview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-apiview.html',
  styleUrl: './dashboard-apiview.component.scss'
})
export class DashboardAPIView implements OnInit, AfterViewInit {
  @ViewChild('receitaChart') receitaChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('veiculosChart') veiculosChartRef!: ElementRef<HTMLCanvasElement>;

  receitaChartInstance?: Chart;
  veiculosChartInstance?: Chart;

  // Variáveis reativas
  receitaHoje: number = 0;
  veiculosHoje: number = 0;
  tempoMedio: number = 0;
  incidentesAtivos: number = 0;

  rankingEficiencia: EficienciaFuncionario[] = [];
  hojeStr = '';

  constructor(private router: Router, private dashboardService: DashboardService, private cdr: ChangeDetectorRef) {
    const dataObj = new Date();
    // Ex: "17 ABR 2026"
    this.hojeStr = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace(' de ', ' ').toUpperCase();
  }

  ngOnInit() {
    this.carregarDados();
  }

  ngAfterViewInit() {
    // Inicialização vazia ou stubs, gráficos serão preenchidos pós fetch
  }

  carregarDados() {
    this.dashboardService.getIndicadores().subscribe({
      next: (res: Indicadores) => {
        this.receitaHoje = res.receitaTotal || 0;
        this.veiculosHoje = res.totalOsFinalizadas || 0;
        this.incidentesAtivos = res.incidentesAtivos || 0;
        
        // Força o Angular a renderizar o DOM imediatamente
        this.cdr.detectChanges();
        
        // Timeout zero garante que o viewChild (DOM target) já existe ou foi atualizado pelo ngIf caso houvesse
        setTimeout(() => {
            this.reenderizarGraficoReceita(res.receita_semanal);
            this.reenderizarGraficoVeiculos(res.volume_por_hora);
        }, 0);
      },
      error: (e) => console.error('Erro ao carregar indicadores', e)
    });

    this.dashboardService.getEficienciaEquipe().subscribe({
      next: (res: EficienciaFuncionario[]) => {
        this.rankingEficiencia = res.sort((a, b) => b.totalOs - a.totalOs);

        let somaTempos = 0;
        let totalServicos = 0;
        res.forEach(item => {
          somaTempos += item.tempoTotalRealMinutos;
          totalServicos += item.totalOs;
        });

        if (totalServicos > 0) {
          this.tempoMedio = Math.round(somaTempos / totalServicos);
        }
        
        // Alerta o Angular das novidades na Eficiencia
        this.cdr.detectChanges();
      },
      error: (e) => console.error('Erro ao carregar ranking', e)
    });
  }

  reenderizarGraficoReceita(dadosSemanas: Array<{ data: string, valor: number }>) {
    if (this.receitaChartInstance) this.receitaChartInstance.destroy();
    if (!this.receitaChartRef) return;

    const labels = dadosSemanas.map(d => {
      const parts = d.data.split('-');
      // Devolve apenas Dia/Mes
      return `${parts[2]}/${parts[1]}`;
    });
    const dados = dadosSemanas.map(d => d.valor);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Receita (R$)',
          data: dados,
          borderColor: '#4A90E2', // Blue Wave style
          backgroundColor: 'rgba(74, 144, 226, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, display: false },
          x: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    };
    this.receitaChartInstance = new Chart(this.receitaChartRef.nativeElement, config);
  }

  reenderizarGraficoVeiculos(volumePorHora: number[]) {
    if (this.veiculosChartInstance) this.veiculosChartInstance.destroy();
    if (!this.veiculosChartRef) return;

    // Filtra horas do expediente (08h às 18h por padrão do lava-jato)
    const labels = [];
    const dados = [];
    for (let i = 8; i <= 18; i++) {
      labels.push(`${i}h`);
      dados.push(volumePorHora[i] || 0);
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Veículos',
          data: dados,
          borderColor: '#2ECC71', // Green Dot Line style
          backgroundColor: 'transparent',
          pointBackgroundColor: '#2ECC71',
          pointRadius: 4,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, display: false },
          x: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    };
    this.veiculosChartInstance = new Chart(this.veiculosChartRef.nativeElement, config);
  }

  irParaIncidentes() {
    this.router.navigate(['/gestao/incidentes']);
  }
}
