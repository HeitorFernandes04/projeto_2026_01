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
  is_atrasado: boolean;
}

export interface KanbanData {
  PATIO: KanbanCard[];
  VISTORIA_INICIAL: KanbanCard[];
  EM_EXECUCAO: KanbanCard[];
  LIBERACAO: KanbanCard[];
}

@Injectable({
  providedIn: 'root'
})
export class KanbanService {
  private readonly apiUrl = '/api/ordens-servico/kanban/';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  obterKanban(): Observable<KanbanData> {
    return this.http.get<KanbanData>(this.apiUrl, { headers: this.getHeaders() });
  }
}
