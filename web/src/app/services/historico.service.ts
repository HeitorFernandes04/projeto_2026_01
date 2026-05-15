import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
  com_incidente_resolvido?: boolean;
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

interface ApiEnvelope<T> {
  data: T;
  meta: Record<string, string | number | null | undefined>;
  errors: Array<{ detail?: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class HistoricoService {
  private readonly urlHistorico = '/api/shared/historico/';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  buscarHistorico(filtros: HistoricoFiltros = {}): Observable<HistoricoResponse> {
    let params = new HttpParams();
    if (filtros.placa)                    params = params.set('placa', filtros.placa);
    if (filtros.status)                   params = params.set('status', filtros.status);
    if (filtros.data_inicio)              params = params.set('data_inicio', filtros.data_inicio);
    if (filtros.data_fim)                 params = params.set('data_fim', filtros.data_fim);
    if (filtros.page)                     params = params.set('page', String(filtros.page));
    if (filtros.com_incidente_resolvido)  params = params.set('com_incidente_resolvido', 'true');

    return this.http.get<ApiEnvelope<HistoricoItem[]>>(this.urlHistorico, {
      headers: this.getHeaders(),
      params,
    }).pipe(
      map((response) => ({
        count: Number(response.meta?.['count'] ?? response.data.length),
        next: (response.meta?.['next'] as string | null | undefined) ?? null,
        previous: (response.meta?.['previous'] as string | null | undefined) ?? null,
        results: response.data,
      })),
    );
  }

  buscarGaleria(osId: number): Observable<GaleriaOS> {
    const url = `${this.urlHistorico}${osId}/galeria/`;
    return this.http
      .get<ApiEnvelope<GaleriaOS>>(url, { headers: this.getHeaders() })
      .pipe(map((response) => response.data));
  }
}
