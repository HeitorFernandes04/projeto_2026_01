import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TagPeca {
  id?: number;
  nome: string;
  categoria: 'INTERNO' | 'EXTERNO';
  estabelecimento?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TagPecaService {
  private readonly apiUrl = '/api/gestao/tags-peca/';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  listarTags(): Observable<TagPeca[]> {
    return this.http.get<TagPeca[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  criarTag(tag: TagPeca): Observable<TagPeca> {
    return this.http.post<TagPeca>(this.apiUrl, tag, { headers: this.getHeaders() });
  }

  atualizarTag(id: number, tag: Partial<TagPeca>): Observable<TagPeca> {
    return this.http.patch<TagPeca>(`${this.apiUrl}${id}/`, tag, { headers: this.getHeaders() });
  }

  deletarTag(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`, { headers: this.getHeaders() });
  }
}
