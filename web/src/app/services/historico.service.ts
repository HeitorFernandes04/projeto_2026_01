import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HistoricoItem {
  id: number;
  placa: string;
  modelo: string;
  servico_nome: string;
  funcionario_nome: string | null;
  status: string;
  data_hora: string;
  horario_lavagem: string | null;
  horario_finalizacao: string | null;
}

export interface HistoricoResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: HistoricoItem[];
}

export interface HistoricoFiltros {
  placa?: string;
  status?: string;
  data_inicio?: string;
  data_fim?: string;
  page?: number;
}

export interface MidiaGaleria {
  id: number;
  arquivo_url: string;
  momento: string;
}

export interface GaleriaOS {
  estado_inicial: MidiaGaleria[];
  estado_meio: MidiaGaleria[];
  estado_final: MidiaGaleria[];
}

@Injectable({
  providedIn: 'root'
})
export class HistoricoService {
  private readonly urlHistorico = '/api/ordens-servico/gestor/historico/';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  buscarHistorico(filtros: HistoricoFiltros = {}): Observable<HistoricoResponse> {
    let params = new HttpParams();
    if (filtros.placa)       params = params.set('placa', filtros.placa);
    if (filtros.status)      params = params.set('status', filtros.status);
    if (filtros.data_inicio) params = params.set('data_inicio', filtros.data_inicio);
    if (filtros.data_fim)    params = params.set('data_fim', filtros.data_fim);
    if (filtros.page)        params = params.set('page', String(filtros.page));

    return this.http.get<HistoricoResponse>(this.urlHistorico, {
      headers: this.getHeaders(),
      params,
    });
  }

  buscarGaleria(osId: number): Observable<GaleriaOS> {
    const url = `${this.urlHistorico}${osId}/fotos/`;
    return this.http.get<GaleriaOS>(url, { headers: this.getHeaders() });
  }
}
