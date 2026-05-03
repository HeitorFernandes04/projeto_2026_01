import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

// Interfaces conforme RF-25
export interface PainelStatus {
  cliente_nome: string;
  ativos: any[];
  historico: any[];
}

@Injectable({ providedIn: 'root' })
export class PainelClienteService {
  // Rota definitiva conforme Trilha 3
  private readonly apiUrl = '/api/cliente/historico/';

  constructor(private http: HttpClient) {}

  /**
   * RF-25.1: Busca dados do painel filtrados por titularidade (RNF-01)
   */
  getDadosPainel(): Observable<PainelStatus> {
    // Por enquanto, retornamos o esqueleto vazio para montarmos a tela
    return of({
      cliente_nome: 'João Silva', // Mock inicial para Letícia Lopes
      ativos: [],
      historico: []
    });
  }
}
