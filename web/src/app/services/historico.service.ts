import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HistoricoService {
  private apiUrl = '/api/ordens-servico/gestor/historico/';

  constructor(private http: HttpClient) {}

  buscarHistorico(filtros: any): Observable<any> {
    let params = new HttpParams();
    
    if (filtros.data_inicio) {
      params = params.set('data_inicio', filtros.data_inicio);
    }
    if (filtros.data_fim) {
      params = params.set('data_fim', filtros.data_fim);
    }
    if (filtros.placa) {
      params = params.set('placa', filtros.placa);
    }
    if (filtros.status && filtros.status !== 'Todos') {
      params = params.set('status', filtros.status.toUpperCase());
    }

    const token = localStorage.getItem('access_token');
    const headers = { 'Authorization': `Bearer ${token}` };

    return this.http.get<any>(this.apiUrl, { params, headers });
  }

  obterFotosAuditoria(osId: number): Observable<any> {
    const token = localStorage.getItem('access_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.get<any>(`${this.apiUrl}${osId}/fotos/`, { headers });
  }
}
