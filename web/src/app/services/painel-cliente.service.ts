import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';

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
  slug_cancelamento?: string; // RF-24.3: exposto apenas para OS em PATIO
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

export interface MidiaGaleriaCliente {
  id: number;
  arquivo_url: string;
  momento: string;
}

export interface LaudoTecnicoCliente {
  servico_realizado: string;
  tempo_execucao_minutos: number | null;
  observacoes: string;
  status_final: string;
  status_final_display: string;
  placa: string;
  veiculo_modelo: string;
  unidade: string;
  data_servico: string;
}

export interface GaleriaClienteResponse {
  ordem_servico_id: number;
  entrada: MidiaGaleriaCliente[];
  finalizacao: MidiaGaleriaCliente[];
  laudo_tecnico: LaudoTecnicoCliente;
}

export interface ApiErroResponse {
  detail?: string;
  error?: string;
}

interface ApiEnvelope<T> {
  data: T;
  meta: Record<string, string | number | null | undefined>;
  errors: Array<{ detail?: string }>;
}

export class GaleriaClienteErro extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'GaleriaClienteErro';
  }
}

@Injectable({ providedIn: 'root' })
export class PainelClienteService {
  private readonly http = inject(HttpClient);
  private readonly painelUrl = '/api/cliente/painel/';
  private readonly historicoUrl = '/api/shared/historico/';

  getDadosPainel(): Observable<PainelStatus> {
    return this.http.get<PainelStatus>(this.painelUrl).pipe(
      map(dados => ({
        cliente_nome: dados.cliente_nome,
        ativos: dados.ativos.map(item => this.normalizarOrdem(item)),
        historico: dados.historico.map(item => this.normalizarOrdem(item)),
        historico_meta: dados.historico_meta,
      })),
    );
  }

  getGaleriaTransparencia(osId: number): Observable<GaleriaClienteResponse> {
    return this.http
      .get<ApiEnvelope<GaleriaClienteResponse>>(`${this.historicoUrl}${osId}/galeria/`)
      .pipe(
        map(response => response.data),
        catchError((error: HttpErrorResponse) => throwError(() => this.normalizarErroGaleria(error))),
      );
  }

  private normalizarErroGaleria(error: HttpErrorResponse): GaleriaClienteErro {
    const body = error.error as ApiErroResponse | null;
    const detalheApi = body?.detail || body?.error;
    const mensagem =
      detalheApi ||
      (error.status === 404
        ? 'Galeria nao encontrada para esta ordem de servico.'
        : 'Nao foi possivel carregar a galeria desta OS.');

    return new GaleriaClienteErro(mensagem, error.status);
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
