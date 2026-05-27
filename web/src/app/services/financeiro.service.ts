import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Transacao {
  id: number;
  horario_finalizacao: string;
  veiculo: string;
  servico: string;
  valor_cobrado: string;
}

export interface FinanceiroResumo {
  estabelecimento_nome: string;
  total_faturado: string;
  transacoes: Transacao[];
}

@Injectable({
  providedIn: 'root'
})
export class FinanceiroService {
  private readonly baseUrl = '/api/gestao/financeiro/resumo/';

  constructor(private readonly http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getResumo(dataInicio?: string, dataFim?: string): Observable<FinanceiroResumo> {
    let params = new HttpParams();
    if (dataInicio) {
      params = params.set('data_inicio', dataInicio);
    }
    if (dataFim) {
      params = params.set('data_fim', dataFim);
    }
    return this.http.get<FinanceiroResumo>(this.baseUrl, { headers: this.getHeaders(), params });
  }
}
