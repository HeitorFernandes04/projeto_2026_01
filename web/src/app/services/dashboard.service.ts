import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Indicadores {
  totalOsFinalizadas: number;
  receitaTotal: number;
  volume_por_hora: number[];
  receita_semanal: { data: string, valor: number }[];
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
  // Ajuste do endopoint base conforme o app
  private baseUrl = '/api/gestao/gestor/dashboard';

  constructor(private http: HttpClient) {}

  getIndicadores(data?: string): Observable<Indicadores> {
    let params = new HttpParams();
    if (data) {
      params = params.set('data', data);
    }
    return this.http.get<Indicadores>(`${this.baseUrl}/indicadores/`, { params });
  }

  getEficienciaEquipe(dataInicio?: string, dataFim?: string): Observable<EficienciaFuncionario[]> {
    let params = new HttpParams();
    if (dataInicio) {
      params = params.set('dataInicio', dataInicio);
    }
    if (dataFim) {
      params = params.set('dataFim', dataFim);
    }
    return this.http.get<EficienciaFuncionario[]>(`${this.baseUrl}/eficiencia-equipe/`, { params });
  }
}
