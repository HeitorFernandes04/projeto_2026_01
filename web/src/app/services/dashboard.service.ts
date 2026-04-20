import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Indicadores {
  totalOsFinalizadas: number;
  receitaTotal: number;
  volume_por_hora: number[];
  receita_semanal: { data: string, valor: number }[];
  incidentesAtivos: number;
}

export interface EficienciaFuncionario {
  funcionarioId: number;
  nomeFuncionario: string;
  totalOs: number;
  tempoTotalEstimadoMinutos: number;
  tempoTotalRealMinutos: number;
  desvioTotalMinutos: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  // Retornando para o proxy relativo do Angular, evitando problemas de CORS diretos
  private baseUrl = '/api/gestao/gestor/dashboard';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getIndicadores(data?: string): Observable<Indicadores> {
    let params = new HttpParams();
    if (data) {
      params = params.set('data', data);
    }
    return this.http.get<Indicadores>(`${this.baseUrl}/indicadores/`, { headers: this.getHeaders(), params });
  }

  getEficienciaEquipe(dataInicio?: string, dataFim?: string): Observable<EficienciaFuncionario[]> {
    let params = new HttpParams();
    if (dataInicio) {
      params = params.set('dataInicio', dataInicio);
    }
    if (dataFim) {
      params = params.set('dataFim', dataFim);
    }
    return this.http.get<EficienciaFuncionario[]>(`${this.baseUrl}/eficiencia-equipe/`, { headers: this.getHeaders(), params });
  }
}
