import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface OrdemServico {
  id: number;
  modelo: string;
  placa: string;
  horario: string;
  data: string;
  servico: string;
  status: 'PATIO' | 'VISTORIA_INICIAL' | 'EM_EXECUCAO' | 'LIBERACAO' | 'FINALIZADO';
  previsao_entrega: string;
  nome_dono?: string;
  slug_cancelamento?: string; // RF-24.3: UUID para cancelamento seguro (nunca ID sequencial)
}

@Injectable({
  providedIn: 'root'
})
export class OrdemServicoService {
  private ordensServicoSubject = new BehaviorSubject<OrdemServico[]>([]);
  private statusAtualSubject = new BehaviorSubject<string>('PATIO');

  // Dados mockados iniciais
  private ordensMock: OrdemServico[] = [
    {
      id: 1,
      modelo: 'Toyota Corolla',
      placa: 'BRA-2E19',
      horario: '18:00',
      data: '06/05/2026',
      servico: 'BASIC',
      status: 'PATIO',
      previsao_entrega: '18:30',
      nome_dono: 'Carlos Silva'
    },
    {
      id: 2,
      modelo: 'Honda Civic',
      placa: 'KYS-1234',
      horario: '08:00',
      data: '06/05/2026',
      servico: 'PREMIUM',
      status: 'EM_EXECUCAO',
      previsao_entrega: '08:30',
      nome_dono: 'Maria Santos'
    },
    {
      id: 3,
      modelo: 'VW Golf',
      placa: 'DEF-5555',
      horario: '10:00',
      data: '15/04/2026',
      servico: 'BASIC',
      status: 'FINALIZADO',
      previsao_entrega: '10:30'
    },
    {
      id: 4,
      modelo: 'Chevrolet Onix',
      placa: 'ABC-1234',
      horario: '14:00',
      data: '10/04/2026',
      servico: 'PREMIUM',
      status: 'FINALIZADO',
      previsao_entrega: '14:45'
    }
  ];

  constructor(private http: HttpClient) {
    this.ordensServicoSubject.next(this.ordensMock);
  }

  // Observable para os componentes escutarem mudanças
  getOrdensServico$() {
    return this.ordensServicoSubject.asObservable();
  }

  getStatusAtual$() {
    return this.statusAtualSubject.asObservable();
  }

  // Método para atualizar o status (simulação em tempo real)
  atualizarStatus(id: number, novoStatus: string) {
    const ordens = this.ordensServicoSubject.value;
    const index = ordens.findIndex(os => os.id === id);
    
    if (index !== -1) {
      ordens[index].status = novoStatus as any;
      this.ordensServicoSubject.next([...ordens]);
      
      // Atualizar o status geral se for o primeiro veículo
      if (index === 0) {
        this.statusAtualSubject.next(novoStatus);
      }
    }
  }

  // Método para simular progresso automático
  iniciarSimulacaoProgresso() {
    const ordens = this.ordensServicoSubject.value;
    
    // Simular mudança de status a cada 5 segundos
    setInterval(() => {
      const ordemAtual = ordens[0]; // Primeira ordem para simulação
      
      if (ordemAtual) {
        let proximoStatus: string;
        
        switch (ordemAtual.status) {
          case 'PATIO':
            proximoStatus = 'VISTORIA_INICIAL';
            break;
          case 'VISTORIA_INICIAL':
            proximoStatus = 'EM_EXECUCAO';
            break;
          case 'EM_EXECUCAO':
            proximoStatus = 'LIBERACAO';
            break;
          case 'LIBERACAO':
            proximoStatus = 'FINALIZADO';
            break;
          default:
            return; // Para a simulação quando finalizado
        }
        
        this.atualizarStatus(ordemAtual.id, proximoStatus);
      }
    }, 5000);
  }

  // Obter ordens ativas (não finalizadas)
  getOrdensAtivas(): OrdemServico[] {
    return this.ordensServicoSubject.value.filter(os => os.status !== 'FINALIZADO');
  }

  // Obter ordens finalizadas
  getOrdensFinalizadas(): OrdemServico[] {
    return this.ordensServicoSubject.value.filter(os => os.status === 'FINALIZADO');
  }

  /**
   * RF-24: Cancela agendamento via UUID (slug_cancelamento).
   * Nunca usa o ID sequencial (RF-24.3).
   */
  cancelarAgendamento(slug: string, motivo: string = ''): Observable<{ detail: string }> {
    const url = `/api/publico/agendamento/ordens-servico/${slug}/cancelar/`;
    return this.http.patch<{ detail: string }>(url, { motivo_cancelamento: motivo });
  }
}
