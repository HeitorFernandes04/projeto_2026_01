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
      horario: '12:00',
      data: '04/05/2026',
      servico: 'Lavagem Básica',
      status: 'PATIO',
      previsao_entrega: '12:30',
      nome_dono: 'João',
      slug_cancelamento: 'f475af97-c771-4d7a-ba1d-1047db93d0e9'
    },
    {
      id: 2,
      modelo: 'Ferrari',
      placa: 'TEST-123',
      horario: '13:00',
      data: '05/05/2026',
      servico: 'Lavagem Premium',
      status: 'PATIO',
      previsao_entrega: '14:00',
      nome_dono: 'Teste',
      slug_cancelamento: '7a3dff0e-8987-44c4-88ef-eb357e34e30a'
    },
    {
      id: 3,
      modelo: 'Civic',
      placa: 'ABC-1425',
      horario: '11:00',
      data: '04/05/2026',
      servico: 'Lavagem Básica',
      status: 'PATIO',
      previsao_entrega: '11:30',
      nome_dono: 'Teste 2',
      slug_cancelamento: 'b7067397-407f-482c-b379-f05a4a091324'
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
