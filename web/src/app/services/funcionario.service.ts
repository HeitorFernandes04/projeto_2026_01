import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Funcionario {
  id?: number;
  name: string;
  email: string;
  password?: string;
  username?: string;
  cargo: string;
  is_active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FuncionarioService {
  /**
   * Endpoints da RF-12 integrados ao GestaoViewSet através do core/urls.py
   */
  private readonly apiUrl = '/api/gestao/funcionarios/';

  constructor(private http: HttpClient) {}

  /**
   * Centraliza a geração dos headers de autenticação conforme padrão do projeto
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Lista funcionários do estabelecimento do gestor logado (IDOR Seguro)
   */
  listarFuncionarios(): Observable<Funcionario[]> {
    return this.http.get<Funcionario[]>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }

  /**
   * Cria um novo funcionário (Injeta estabelecimento no backend)
   */
  criarFuncionario(dados: Funcionario): Observable<Funcionario> {
    return this.http.post<Funcionario>(this.apiUrl, dados, {
      headers: this.getHeaders()
    });
  }

  /**
   * Inativa um funcionário (CA-02: Soft Delete)
   */
  inativarFuncionario(id: number): Observable<Funcionario> {
    return this.http.patch<Funcionario>(`${this.apiUrl}${id}/`, { is_active: false }, {
      headers: this.getHeaders()
    });
  }
}
