import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable } from 'rxjs';
import { catchError, distinctUntilChanged, map, tap } from 'rxjs/operators';

export interface IncidentePendente {
  id: number;
  ordem_servico_id: number;
  status_ordem_servico: string;
  placa: string;
  modelo: string;
  servico: string;
  tag_peca: string;
  descricao: string;
  foto_url: string | null;
  data_registro: string;
}

export interface IncidenteAuditoriaOrdemServico {
  id: number;
  status: string;
  placa: string;
  modelo: string;
  marca: string;
  cor: string;
  nome_dono: string | null;
  celular_dono: string | null;
  funcionario_responsavel_nome: string | null;
  servico: string;
  horario_lavagem: string | null;
  horario_acabamento: string | null;
  horario_finalizacao: string | null;
}

export interface IncidenteAuditoriaTagPeca {
  id: number;
  nome: string;
  categoria: string;
}

export interface IncidenteAuditoriaVistoriaItem {
  id: number;
  possui_avaria: boolean;
  foto_url: string | null;
}

export interface IncidenteAuditoria {
  id: number;
  descricao: string;
  foto_url: string | null;
  data_registro: string;
  resolvido: boolean;
  status_anterior_os: string;
  vista_inicial_foto_url: string | null;
  ordem_servico: IncidenteAuditoriaOrdemServico;
  tag_peca: IncidenteAuditoriaTagPeca;
  vistoria_item: IncidenteAuditoriaVistoriaItem | null;
}

export interface ResolverIncidenteResponse {
  detail: string;
  id: number;
  ordem_servico_status: string;
}

@Injectable({
  providedIn: 'root',
})
export class IncidentesService {
  private readonly apiUrl = '/api/incidentes-os/';
  private readonly pendentesSubject = new BehaviorSubject<IncidentePendente[]>([]);
  private pollingHandle?: ReturnType<typeof setInterval>;
  private monitoramentosAtivos = 0;

  readonly pendentes$ = this.pendentesSubject.asObservable();
  readonly totalPendentes$ = this.pendentes$.pipe(
    map((incidentes) => incidentes.length),
    distinctUntilChanged(),
  );

  constructor(private readonly http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  listarPendentes(): Observable<IncidentePendente[]> {
    return this.http.get<IncidentePendente[]>(`${this.apiUrl}pendentes/`, {
      headers: this.getHeaders(),
    });
  }

  recarregarPendentes(): Observable<IncidentePendente[]> {
    return this.listarPendentes().pipe(
      tap((incidentes) => this.pendentesSubject.next(incidentes)),
    );
  }

  snapshotPendentes(): IncidentePendente[] {
    return this.pendentesSubject.value;
  }

  iniciarMonitoramentoPendentes(intervaloMs = 30000): void {
    this.monitoramentosAtivos += 1;

    if (this.pollingHandle) {
      return;
    }

    this.recarregarPendentes()
      .pipe(catchError(() => EMPTY))
      .subscribe();

    this.pollingHandle = setInterval(() => {
      this.recarregarPendentes()
        .pipe(catchError(() => EMPTY))
        .subscribe();
    }, intervaloMs);
  }

  pararMonitoramentoPendentes(): void {
    if (this.monitoramentosAtivos > 0) {
      this.monitoramentosAtivos -= 1;
    }

    if (this.monitoramentosAtivos === 0 && this.pollingHandle) {
      clearInterval(this.pollingHandle);
      this.pollingHandle = undefined;
    }
  }

  obterAuditoria(id: number): Observable<IncidenteAuditoria> {
    return this.http.get<IncidenteAuditoria>(`${this.apiUrl}${id}/auditoria/`, {
      headers: this.getHeaders(),
    });
  }

  resolverIncidente(id: number, observacoes_resolucao: string): Observable<ResolverIncidenteResponse> {
    return this.http.patch<ResolverIncidenteResponse>(
      `${this.apiUrl}${id}/resolver/`,
      { observacoes_resolucao },
      { headers: this.getHeaders() },
    );
  }
}
