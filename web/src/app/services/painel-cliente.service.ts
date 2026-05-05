import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

export interface PainelStatus {
  cliente_nome: string;
  ativos: any[];
  historico: any[];
}

@Injectable({ providedIn: 'root' })
export class PainelClienteService {
  private readonly apiUrl = '/api/cliente/painel/';
  private readonly dadosMockados: PainelStatus = {
    cliente_nome: 'João Silva',
    ativos: [
      {
        id: 1,
        modelo: 'Toyota Corolla',
        placa: 'BRA-2E19',
        horario: '18:00',
        data: '06/05/2026',
        servico: 'BASIC',
        status: 'PATIO',
        previsao_entrega: '18:30',
        nome_dono: 'Carlos Silva'
      },
      {
        id: 2,
        modelo: 'Honda Civic',
        placa: 'KYS-1234',
        horario: '08:00',
        data: '06/05/2026',
        servico: 'PREMIUM',
        status: 'EM_EXECUCAO',
        previsao_entrega: '08:30',
        nome_dono: 'Maria Santos'
      }
    ],
    historico: [
      {
        id: 3,
        modelo: 'VW Golf',
        placa: 'DEF-5555',
        horario: '10:00',
        data: '15/04/2026',
        servico: 'BASIC',
        status: 'FINALIZADO',
        previsao_entrega: '10:30'
      },
      {
        id: 4,
        modelo: 'Chevrolet Onix',
        placa: 'ABC-1234',
        horario: '14:00',
        data: '10/04/2026',
        servico: 'PREMIUM',
        status: 'FINALIZADO',
        previsao_entrega: '14:45'
      }
    ]
  };

  constructor(private http: HttpClient) {}

  getDadosPainel(): Observable<PainelStatus> {
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.get<PainelStatus>(this.apiUrl, { headers }).pipe(
      map(dados => ({
        cliente_nome: dados.cliente_nome,
        ativos: dados.ativos.map(item => this.normalizarOrdem(item)),
        historico: dados.historico.map(item => this.normalizarOrdem(item)),
      })),
      map(dados => this.temDados(dados) ? dados : this.dadosMockados),
      catchError(() => of(this.dadosMockados))
    );
  }

  private normalizarOrdem(item: any): any {
    if (!item.data_hora) return item;

    const data = item.data_hora ? new Date(item.data_hora) : null;
    return {
      ...item,
      horario: data ? data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--',
      data: data ? data.toLocaleDateString('pt-BR') : '--/--/----',
      previsao_entrega: data ? data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--',
    };
  }

  private temDados(dados: PainelStatus): boolean {
    return dados.ativos.length > 0 || dados.historico.length > 0;
  }
}
