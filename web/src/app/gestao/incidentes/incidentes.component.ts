import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-incidentes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './incidentes.component.html',
  styleUrl: './incidentes.component.scss'
})
export class IncidentesComponent {
  // Controle de visibilidade do modal
  modalAberto: boolean = false;
  incidenteSelecionado: any = null;

  // Simulação de OS bloqueadas que requerem atenção do Gestor (RF-15/16)
  incidentes = [
    {
      os: '1024',
      placa: 'BRA-2E19',
      modelo: 'Audi A3',
      motivo: 'Divergência de Valor',
      descricao: 'O valor do serviço selecionado é inferior ao preço de tabela configurado.',
      criticidade: 'alta',
      relato: 'Valor inserido manualmente pelo operador abaixo da margem permitida.',
      status: 'Bloqueado na Vistoria',
      reportadoPor: 'Carlos Silva',
      data: '2026-04-14 14:35'
    },
    {
      os: '1028',
      placa: 'KLT-4412',
      modelo: 'Toyota Hilux',
      motivo: 'Tempo de Execução Excedido',
      descricao: 'Veículo parado na Lavagem há mais de 120 minutos sem atualização.',
      criticidade: 'media',
      relato: 'Atraso devido à alta demanda no setor de secagem.',
      status: 'Atrasado na Lavagem',
      reportadoPor: 'João Santos',
      data: '2026-04-14 13:20'
    }
  ];

  /**
   * Abre o modal com as informações do incidente clicado
   */
  abrirModal(incidente?: any) {
    this.incidenteSelecionado = incidente || {
      os: '8829',
      placa: 'JKL-7890',
      modelo: 'Fiat Uno',
      status: 'Bloqueado na Vistoria',
      relato: 'Arranhão profundo detectado no lado direito do para-choque. O cliente alega que o veículo não tinha essa avaria. Aguardando verificação das câmeras de entrada.',
      reportadoPor: 'Carlos Silva',
      data: 'Hoje às 14:35'
    };
    this.modalAberto = true;
  }

  /**
   * Fecha o modal de detalhes
   */
  fecharModal() {
    this.modalAberto = false;
    this.incidenteSelecionado = null;
  }

  /**
   * Lógica para liberar a Ordem de Serviço bloqueada
   */
  liberarOS(osId: string) {
    console.log(`Solicitando senha de gestor para liberar OS: ${osId}`);
    this.fecharModal();
    // Futura implementação de modal de senha para auditoria
  }
}
