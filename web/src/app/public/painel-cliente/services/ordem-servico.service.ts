import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrdemServicoAPI {
  id: number;
  data_hora: string;
  status: string;
  status_display: string;
  etapa_atual: number;
  servico_nome: string;
  veiculo_placa: string;
  veiculo_modelo: string;
  slug_cancelamento?: string; // RF-24.3: UUID para cancelamento seguro (nunca ID sequencial)
  estabelecimento: { nome_fantasia: string; slug: string };
}

export interface PainelResponse {
  cliente_nome: string;
  ativos: OrdemServicoAPI[];
  historico: OrdemServicoAPI[];
}


@Injectable({ providedIn: 'root' })
export class OrdemServicoService {
  private readonly http = inject(HttpClient);

  getDadosPainel(): Observable<PainelResponse> {
    return this.http.get<PainelResponse>('/api/cliente/historico/');
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
