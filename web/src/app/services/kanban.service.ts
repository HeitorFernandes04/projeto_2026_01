import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface KanbanCard {
  id: number;
  placa: string;
  modelo: string;
  servico: string;
  duracao_estimada_minutos: number;
  tempo_decorrido_minutos: number;
  tempo_decorrido_segundos?: number;
  is_atrasado: boolean;
  funcionario_nome?: string;
  is_pausado?: boolean;
}

export interface KanbanData {
  PATIO: KanbanCard[];
  LAVAGEM: KanbanCard[];
  FINALIZADO_HOJE: KanbanCard[];
  INCIDENTES: KanbanCard[];
}

@Injectable({
  providedIn: 'root'
})
export class KanbanService {
  private readonly apiUrl = '/api/ordens-servico/kanban/';

  constructor(private readonly http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  obterKanban(): Observable<KanbanData> {
    return this.http.get<KanbanData>(this.apiUrl, { headers: this.getHeaders() });
  }
}
