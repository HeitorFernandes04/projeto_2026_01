import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Servico {
  id?: number;
  nome: string;
  preco: number;
  duracao_estimada_minutos: number;
  is_active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ServicoService {
  private readonly apiUrl = '/api/gestao/servicos/';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  listarServicos(): Observable<Servico[]> {
    return this.http.get<Servico[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(servicos => {
        console.log('JSON da API (antes do mapeamento):', servicos);
        return servicos.map(s => ({
          ...s,
          // Converte string decimal do Django para number do TypeScript
          preco: isNaN(parseFloat(String(s.preco))) ? 0 : parseFloat(String(s.preco)),
          // Converte duração para número seguro
          duracao_estimada_minutos: isNaN(parseInt(String(s.duracao_estimada_minutos))) ? 0 : parseInt(String(s.duracao_estimada_minutos))
        }));
      })
    );
  }

  criarServico(servico: Omit<Servico, 'id'>): Observable<Servico> {
    return this.http.post<Servico>(this.apiUrl, servico, { headers: this.getHeaders() });
  }

  atualizarServico(id: number, servico: Partial<Servico>): Observable<Servico> {
    return this.http.patch<Servico>(`${this.apiUrl}${id}/`, servico, { headers: this.getHeaders() });
  }

  deletarServico(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`, { headers: this.getHeaders() });
  }
}