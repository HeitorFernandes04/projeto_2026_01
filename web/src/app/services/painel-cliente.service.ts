import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

export interface EstabelecimentoResumo {
  nome_fantasia: string;
  slug: string;
}

export interface OrdemServicoCliente {
  id: number;
  data_hora: string;
  status: string;
  status_display: string;
  etapa_atual: number;
  servico_nome: string;
  veiculo_placa: string;
  veiculo_modelo: string;
  estabelecimento: EstabelecimentoResumo;
  horario?: string;
  data?: string;
  previsao_entrega?: string;
}

export interface HistoricoMeta {
  total: number;
  limit: number;
  has_more: boolean;
}

export interface GrupoEstabelecimento {
  nome_fantasia: string;
  slug: string;
  ordens: OrdemServicoCliente[];
}

export interface PainelStatus {
  cliente_nome: string;
  ativos: OrdemServicoCliente[];
  historico: OrdemServicoCliente[];
  historico_meta?: HistoricoMeta;
}

@Injectable({ providedIn: 'root' })
export class PainelClienteService {
  private readonly apiUrl = '/api/cliente/historico/';
  private readonly dadosMockados: PainelStatus = {
    cliente_nome: 'João Silva',
    ativos: [
      {
        id: 1,
        data_hora: new Date().toISOString(),
        status: 'PATIO',
        status_display: 'Pátio',
        etapa_atual: 1,
        servico_nome: 'BASIC',
        veiculo_placa: 'BRA-2E19',
        veiculo_modelo: 'Toyota Corolla',
        estabelecimento: { nome_fantasia: 'Lava-Me Centro', slug: 'lava-me-centro' },
      },
      {
        id: 2,
        data_hora: new Date().toISOString(),
        status: 'EM_EXECUCAO',
        status_display: 'Em Execução',
        etapa_atual: 3,
        servico_nome: 'PREMIUM',
        veiculo_placa: 'KYS-1234',
        veiculo_modelo: 'Honda Civic',
        estabelecimento: { nome_fantasia: 'Lava-Me Norte', slug: 'lava-me-norte' },
      },
    ],
    historico: [
      {
        id: 3,
        data_hora: '2026-04-15T10:00:00Z',
        status: 'FINALIZADO',
        status_display: 'Finalizado',
        etapa_atual: 4,
        servico_nome: 'BASIC',
        veiculo_placa: 'DEF-5555',
        veiculo_modelo: 'VW Golf',
        estabelecimento: { nome_fantasia: 'Lava-Me Centro', slug: 'lava-me-centro' },
      },
      {
        id: 4,
        data_hora: '2026-04-10T14:00:00Z',
        status: 'FINALIZADO',
        status_display: 'Finalizado',
        etapa_atual: 4,
        servico_nome: 'PREMIUM',
        veiculo_placa: 'ABC-1234',
        veiculo_modelo: 'Chevrolet Onix',
        estabelecimento: { nome_fantasia: 'Lava-Me Norte', slug: 'lava-me-norte' },
      },
    ],
    historico_meta: { total: 2, limit: 50, has_more: false },
  };

  constructor(private readonly http: HttpClient) {}

  getDadosPainel(): Observable<PainelStatus> {
    return this.http.get<PainelStatus>(this.apiUrl).pipe(
      map(dados => ({
        cliente_nome: dados.cliente_nome,
        ativos: dados.ativos.map(item => this.normalizarOrdem(item)),
        historico: dados.historico.map(item => this.normalizarOrdem(item)),
        historico_meta: dados.historico_meta,
      })),
      map(dados => this.temDados(dados) ? dados : this.dadosMockados),
      catchError(() => of(this.dadosMockados))
    );
  }

  private normalizarOrdem(item: OrdemServicoCliente): OrdemServicoCliente {
    if (!item.data_hora) return item;
    const data = new Date(item.data_hora);
    return {
      ...item,
      horario: data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      data: data.toLocaleDateString('pt-BR'),
      previsao_entrega: data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
  }

  private temDados(dados: PainelStatus): boolean {
    return dados.ativos.length > 0 || dados.historico.length > 0;
  }
}
