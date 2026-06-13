import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceiroService, FinanceiroResumo } from '../../services/financeiro.service';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './financeiro.component.html',
  styleUrl: './financeiro.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinanceiroComponent implements OnInit {
  private readonly financeiroService = inject(FinanceiroService);
  private readonly cdRef = inject(ChangeDetectorRef);

  resumo: FinanceiroResumo | null = null;
  loading = false;
  errorMsg = '';

  // Filtros de período (iniciado com o 1º dia do mês corrente até hoje)
  dataInicio = '';
  dataFim = '';

  // Visualização de veículo
  mostrarVeiculos = true;

  ngOnInit() {
    this.iniciarPeriodo();
    this.carregarResumo();
  }

  iniciarPeriodo() {
    const hoje = new Date();
    
    // Primeiro dia do mês corrente
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    this.dataInicio = this.formatarDateIso(primeiroDia);
    this.dataFim = this.formatarDateIso(hoje);
  }

  private formatarDateIso(d: Date): string {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  carregarResumo() {
    this.loading = true;
    this.errorMsg = '';
    this.cdRef.markForCheck();

    this.financeiroService.getResumo(this.dataInicio, this.dataFim).subscribe({
      next: (res) => {
        this.resumo = res;
        this.loading = false;
        this.cdRef.markForCheck();
      },
      error: () => {
        this.errorMsg = 'Erro ao carregar dados financeiros. Verifique sua conexão.';
        this.loading = false;
        this.cdRef.markForCheck();
      }
    });
  }

  buscar() {
    if (!this.dataInicio || !this.dataFim) {
      this.errorMsg = 'Preencha ambas as datas para filtrar.';
      return;
    }
    if (new Date(this.dataInicio) > new Date(this.dataFim)) {
      this.errorMsg = 'A data de início não pode ser maior que a data de fim.';
      return;
    }
    this.carregarResumo();
  }

  limpar() {
    this.iniciarPeriodo();
    this.carregarResumo();
  }

  get totalServicos(): number {
    return this.resumo?.transacoes?.length || 0;
  }

  get ticketMedio(): number {
    const total = parseFloat(this.resumo?.total_faturado || '0');
    const qtd = this.totalServicos;
    return qtd > 0 ? total / qtd : 0;
  }

  formatBRL(valor: string | number | undefined | null): string {
    if (valor === undefined || valor === null) return 'R$ 0,00';
    const parsed = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(parsed)) return 'R$ 0,00';
    return 'R$ ' + parsed.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  }

  formatarDataBr(dataIso: string): string {
    if (!dataIso) return '--';
    const partes = dataIso.split('-');
    if (partes.length !== 3) return dataIso;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  exportarPDF() {
    const doc = new jsPDF();
    
    // Cores
    const cinzaTexto = [100, 110, 120];
    const pretoCabecalho = [15, 18, 24];
    
    // Título e cabeçalho do documento (Nome do Estabelecimento no topo)
    const estNome = this.resumo?.estabelecimento_nome || "Lava-Me";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(pretoCabecalho[0], pretoCabecalho[1], pretoCabecalho[2]);
    doc.text(estNome, 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Relatório Financeiro de Faturamento", 14, 26);
    
    doc.setTextColor(cinzaTexto[0], cinzaTexto[1], cinzaTexto[2]);
    const periodoText = `Período: ${this.formatarDataBr(this.dataInicio)} até ${this.formatarDataBr(this.dataFim)}`;
    doc.text(periodoText, 14, 32);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 37);
    
    // Linha divisória
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 40, 196, 40);
    
    // Seção de Indicadores
    doc.setFontSize(12);
    doc.setTextColor(pretoCabecalho[0], pretoCabecalho[1], pretoCabecalho[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo de Indicadores", 14, 49);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total Faturado: ${this.formatBRL(this.resumo?.total_faturado)}`, 14, 56);
    doc.text(`Total de Serviços: ${this.totalServicos}`, 14, 61);
    doc.text(`Ticket Médio: ${this.formatBRL(this.ticketMedio)}`, 14, 66);
    
    // Linha divisória
    doc.line(14, 72, 196, 72);
    
    // Tabela de Transações
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Detalhamento de Transações", 14, 80);
    
    // Cabeçalho da tabela no PDF
    let startY = 86;
    doc.setFontSize(9);
    doc.setFillColor(240, 240, 240);
    doc.rect(14, startY, 182, 7, "F");
    
    doc.setTextColor(0, 0, 0);
    doc.text("Finalização", 16, startY + 5);
    if (this.mostrarVeiculos) {
      doc.text("Veículo", 50, startY + 5);
      doc.text("Serviço", 110, startY + 5);
    } else {
      doc.text("Serviço", 50, startY + 5);
    }
    doc.text("Valor Cobrado", 160, startY + 5);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    
    let lineY = startY + 7;
    const transacoes = this.resumo?.transacoes || [];
    
    for (const t of transacoes) {
      if (lineY > 270) {
        doc.addPage();
        lineY = 20;
        
        // Cabeçalho da nova página
        doc.setFillColor(240, 240, 240);
        doc.rect(14, lineY, 182, 7, "F");
        doc.setFont("helvetica", "bold");
        doc.text("Finalização", 16, lineY + 5);
        if (this.mostrarVeiculos) {
          doc.text("Veículo", 50, lineY + 5);
          doc.text("Serviço", 110, lineY + 5);
        } else {
          doc.text("Serviço", 50, lineY + 5);
        }
        doc.text("Valor Cobrado", 160, lineY + 5);
        doc.setFont("helvetica", "normal");
        lineY += 7;
      }
      
      const dataFinalizacao = t.horario_finalizacao 
        ? new Date(t.horario_finalizacao).toLocaleDateString('pt-BR') 
        : '--';
        
      doc.text(dataFinalizacao, 16, lineY + 5);
      if (this.mostrarVeiculos) {
        doc.text(t.veiculo || 'Sem Veículo', 50, lineY + 5);
        doc.text(t.servico || 'Sem Serviço', 110, lineY + 5);
      } else {
        doc.text(t.servico || 'Sem Serviço', 50, lineY + 5);
      }
      doc.text(this.formatBRL(t.valor_cobrado), 160, lineY + 5);
      
      doc.setDrawColor(240, 240, 240);
      doc.line(14, lineY + 7, 196, lineY + 7);
      lineY += 7;
    }
    
    // Adiciona rodapés em todas as páginas
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      
      // Nome do sistema (Lava-Me) de cantinho no rodapé
      doc.text("Lava-Me", 14, 290);
      
      // Paginação
      doc.text(`Página ${i} de ${pageCount}`, 175, 290);
    }
    
    doc.save("Relatorio_Financeiro.pdf");
  }
}
