import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface IncidentePendente {
  id: number;
  ordem_servico_id: number;
  status_ordem_servico: string;
  placa: string;
  modelo: string;
  servico: string;
  tag_peca: string;
  descricao: string;
  foto_url: string | null;
  data_registro: string;
}


@Injectable({
  providedIn: 'root',
})
export class IncidentesService {
  private readonly apiUrl = '/api/incidentes-os/pendentes/';

  constructor(private readonly http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  listarPendentes(): Observable<IncidentePendente[]> {
    return this.http.get<IncidentePendente[]>(this.apiUrl, {
      headers: this.getHeaders(),
    });
  }
}
