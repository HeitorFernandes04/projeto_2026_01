import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

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

  constructor(private readonly http: HttpClient) {}

  getDadosPainel(): Observable<PainelStatus> {
    return this.http.get<PainelStatus>(this.apiUrl).pipe(
      map(dados => ({
        cliente_nome: dados.cliente_nome,
        ativos: dados.ativos.map(item => this.normalizarOrdem(item)),
        historico: dados.historico.map(item => this.normalizarOrdem(item)),
        historico_meta: dados.historico_meta,
      })),
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
}
