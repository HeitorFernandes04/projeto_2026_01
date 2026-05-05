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
}
