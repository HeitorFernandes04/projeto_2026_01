import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// ────────────────────────────────────────────────────────────────────────────
// Interfaces públicas do Portal de Autoagendamento (RF-21)
// Espelham estritamente os campos seguros retornados pelo serializer Django.
// ────────────────────────────────────────────────────────────────────────────
export interface ServicoPublico {
  id: number;
  nome: string;
  preco: number;
  duracao_estimada_minutos: number;
}

export interface EstabelecimentoPublico {
  id: number;
  nome_fantasia: string;
  endereco_completo: string;
  logo_url?: string; // Campo opcional vindo do backend
  servicos: ServicoPublico[];
}

@Injectable({
  providedIn: 'root'
})
export class AutoagendamentoPublicoService {
  // Endpoint público — sem autenticação (RF-21)
  private readonly apiUrl = '/api/publico/estabelecimento';

  constructor(private http: HttpClient) {}

  /**
   * Busca os dados públicos de um estabelecimento pelo slug.
   * Retorna 404 se o slug não existir ou o estabelecimento estiver inativo.
   */
  getEstabelecimento(slug: string): Observable<EstabelecimentoPublico> {
    return this.http
      .get<EstabelecimentoPublico>(`${this.apiUrl}/${slug}/`)
      .pipe(
        map(est => ({
          ...est,
          // Normaliza preços de string decimal Django para number TypeScript
          servicos: est.servicos.map(s => ({
            ...s,
            preco: parseFloat(String(s.preco)) || 0,
            duracao_estimada_minutos: parseInt(String(s.duracao_estimada_minutos), 10) || 0
          }))
        }))
      );
  }
}
