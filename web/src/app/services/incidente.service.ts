import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IncidenteOrdemServico {
  id: number;
  veiculo: {
    placa: string;
    modelo: string;
    marca: string;
    cor: string;
  };
  servico: {
    nome: string;
    duracao_estimada_minutos: number;
  };
  status: string;
  status_display: string;
  data_hora: string;
}

export interface IncidenteOS {
  id: number;
  ordem_servico: IncidenteOrdemServico;
  tag_peca: {
    id: number;
    nome: string;
    categoria: string;
  };
  descricao: string;
  foto_url: string | null;
  status_anterior_os: string;
  resolvido: boolean;
  data_registro: string;
  data_resolucao: string | null;
  observacoes_resolucao: string | null;
}

@Injectable({ providedIn: 'root' })
export class IncidenteService {
  private readonly baseUrl = '/api/incidentes-os';

  constructor(private http: HttpClient) {}

  listarPendentes(estabelecimentoId?: number): Observable<IncidenteOS[]> {
    let params = new HttpParams();
    if (estabelecimentoId) {
      params = params.set('estabelecimento_id', estabelecimentoId);
    }

    return this.http.get<IncidenteOS[]>(`${this.baseUrl}/pendentes/`, {
      headers: this.getHeaders(),
      params,
    });
  }

  obterAuditoria(id: number): Observable<IncidenteOS> {
    return this.http.get<IncidenteOS>(`${this.baseUrl}/${id}/auditoria/`, {
      headers: this.getHeaders(),
    });
  }

  resolver(id: number, notaResolucao: string): Observable<IncidenteOS> {
    return this.http.patch<IncidenteOS>(
      `${this.baseUrl}/${id}/resolver/`,
      { nota_resolucao: notaResolucao },
      { headers: this.getHeaders() },
    );
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }
}
