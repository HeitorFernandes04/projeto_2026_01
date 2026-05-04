import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export type OrdemServicoStatus =
  | 'PATIO'
  | 'VISTORIA_INICIAL'
  | 'EM_EXECUCAO'
  | 'LIBERACAO'
  | 'FINALIZADO'
  | 'CANCELADO';

export interface OrdemServico {
  id: number;
  modelo: string;
  placa: string;
  horario: string;
  data: string;
  servico: string;
  status: OrdemServicoStatus;
  previsao_entrega: string;
  nome_dono?: string;
  slug_cancelamento?: string;
}

export interface OrdemServicoApiResponse {
  id: number;
  veiculo?: {
    placa?: string;
    modelo?: string;
    nome_dono?: string;
  };
  servico?: {
    nome?: string;
    duracao_estimada_minutos?: number;
  };
  data_hora: string;
  status: OrdemServicoStatus;
  slug_cancelamento?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrdemServicoService {
  private ordensServicoSubject = new BehaviorSubject<OrdemServico[]>([]);
  private statusAtualSubject = new BehaviorSubject<OrdemServicoStatus>('PATIO');

  constructor(private http: HttpClient) {
    this.carregarOrdemAtivaDoStorage();
  }

  getOrdensServico$(): Observable<OrdemServico[]> {
    return this.ordensServicoSubject.asObservable();
  }

  getStatusAtual$(): Observable<OrdemServicoStatus> {
    return this.statusAtualSubject.asObservable();
  }

  atualizarStatus(id: number, novoStatus: OrdemServicoStatus): void {
    const ordens = this.ordensServicoSubject.value;
    const index = ordens.findIndex(os => os.id === id);

    if (index !== -1) {
      ordens[index].status = novoStatus;
      this.ordensServicoSubject.next([...ordens]);

      if (index === 0) {
        this.statusAtualSubject.next(novoStatus);
      }
    }
  }

  getOrdensAtivas(): OrdemServico[] {
    return this.ordensServicoSubject.value.filter(
      os => os.status !== 'FINALIZADO' && os.status !== 'CANCELADO',
    );
  }

  getOrdensFinalizadas(): OrdemServico[] {
    return this.ordensServicoSubject.value.filter(os => os.status === 'FINALIZADO');
  }

  removerOrdemAtiva(osId: number): void {
    const ordens = this.ordensServicoSubject.value.filter(os => os.id !== osId);
    sessionStorage.removeItem('ordemServicoAtiva');
    this.ordensServicoSubject.next(ordens);
  }

  /**
   * RF-24: Cancela agendamento via UUID (slug_cancelamento).
   * Nunca usa o ID sequencial (RF-24.3).
   */
  cancelarAgendamento(slug: string, motivo: string = ''): Observable<{ detail: string }> {
    const url = `/api/publico/agendamento/ordens-servico/${slug}/cancelar/`;
    return this.http.patch<{ detail: string }>(url, { motivo_cancelamento: motivo });
  }

  private carregarOrdemAtivaDoStorage(): void {
    const raw = sessionStorage.getItem('ordemServicoAtiva');

    if (!raw) {
      this.ordensServicoSubject.next([]);
      return;
    }

    try {
      const ordemApi = JSON.parse(raw) as OrdemServicoApiResponse;
      const ordem = this.mapearOrdemApi(ordemApi);
      this.ordensServicoSubject.next(ordem.status === 'CANCELADO' ? [] : [ordem]);
      this.statusAtualSubject.next(ordem.status);
    } catch {
      sessionStorage.removeItem('ordemServicoAtiva');
      this.ordensServicoSubject.next([]);
    }
  }

  private mapearOrdemApi(os: OrdemServicoApiResponse): OrdemServico {
    const dataHora = new Date(os.data_hora);

    return {
      id: os.id,
      modelo: os.veiculo?.modelo ?? '',
      placa: os.veiculo?.placa ?? '',
      horario: dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      data: dataHora.toLocaleDateString('pt-BR'),
      servico: os.servico?.nome ?? '',
      status: os.status,
      previsao_entrega: this.calcularPrevisaoEntrega(
        dataHora,
        os.servico?.duracao_estimada_minutos,
      ),
      nome_dono: os.veiculo?.nome_dono ?? '',
      slug_cancelamento: os.slug_cancelamento,
    };
  }

  private calcularPrevisaoEntrega(dataHora: Date, duracaoMinutos?: number): string {
    if (!duracaoMinutos) return '';

    const previsao = new Date(dataHora);
    previsao.setMinutes(previsao.getMinutes() + duracaoMinutos);
    return previsao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
}
