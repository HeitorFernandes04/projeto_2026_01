import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Estabelecimento {
  id: number;
  nome_fantasia: string;
  cnpj: string;
  endereco_completo: string;
  is_active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EstabelecimentoService {
  /**
   * Ajustado para o caminho absoluto com prefixo /api/ conforme configurado no Django
   * A barra final é obrigatória para compatibilidade com o APPEND_SLASH do Django
   */
  private readonly apiUrl = '/api/gestao/estabelecimento/';

  constructor(private http: HttpClient) {}

  /**
   * Centraliza a geração dos headers de autenticação
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * GET /api/gestao/estabelecimento/
   * Recupera os dados da unidade vinculada ao gestor logado
   */
  obterDadosEstabelecimento(): Observable<Estabelecimento> {
    return this.http.get<Estabelecimento>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }

  /**
   * PATCH /api/gestao/estabelecimento/
   * Atualiza os dados cadastrais da unidade (RF-13)
   */
  atualizarDadosEstabelecimento(dados: Partial<Estabelecimento>): Observable<Estabelecimento> {
    return this.http.patch<Estabelecimento>(this.apiUrl, dados, {
      headers: this.getHeaders()
    });
  }
}