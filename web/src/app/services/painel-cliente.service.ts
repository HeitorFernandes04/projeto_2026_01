import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface PainelStatus {
  cliente_nome: string;
  ativos: any[];
  historico: any[];
}

@Injectable({ providedIn: 'root' })
export class PainelClienteService {
  private readonly apiUrl = '/api/cliente/painel/';

  constructor(private http: HttpClient) {}

  getDadosPainel(): Observable<PainelStatus> {
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.get<PainelStatus>(this.apiUrl, { headers }).pipe(
      map(dados => ({
        cliente_nome: dados.cliente_nome,
        ativos: dados.ativos.map(item => this.normalizarOrdem(item)),
        historico: dados.historico.map(item => this.normalizarOrdem(item)),
      }))
    );
  }

  private normalizarOrdem(item: any): any {
    const data = item.data_hora ? new Date(item.data_hora) : null;
    return {
      ...item,
      horario: data ? data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--',
      data: data ? data.toLocaleDateString('pt-BR') : '--/--/----',
      previsao_entrega: data ? data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--',
    };
  }
}
