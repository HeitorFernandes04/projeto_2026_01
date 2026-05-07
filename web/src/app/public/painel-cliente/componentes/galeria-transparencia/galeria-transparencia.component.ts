import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  GaleriaClienteErro,
  GaleriaClienteResponse,
  LaudoTecnicoCliente,
  MidiaGaleriaCliente,
  PainelClienteService,
} from '../../../../services/painel-cliente.service';

@Component({
  selector: 'app-galeria-transparencia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './galeria-transparencia.component.html',
  styleUrls: ['./galeria-transparencia.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GaleriaTransparenciaComponent implements OnInit {
  osId: number | null = null;
  galeria: GaleriaClienteResponse | null = null;
  carregando = true;
  erro = '';
  fotoAmpliada: string | null = null;

  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly painelClienteService = inject(PainelClienteService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    const osParam = this.route.snapshot.queryParamMap.get('os');
    this.osId = osParam ? Number(osParam) : null;

    if (!this.osId) {
      this.erro = 'Ordem de servico nao informada.';
      this.carregando = false;
      this.cdr.markForCheck();
      return;
    }

    this.carregarGaleria();
  }

  carregarGaleria(): void {
    if (!this.osId) return;

    this.carregando = true;
    this.erro = '';
    this.painelClienteService.getGaleriaTransparencia(this.osId).subscribe({
      next: (galeria) => {
        this.galeria = galeria;
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.erro = this.montarMensagemErro(error);
        this.carregando = false;
        this.cdr.markForCheck();
      },
    });
  }

  fotosFinalizacao(): MidiaGaleriaCliente[] {
    return this.galeria?.finalizacao ?? [];
  }

  fotosEntrada(): MidiaGaleriaCliente[] {
    return this.galeria?.entrada ?? [];
  }

  laudoTecnico(): LaudoTecnicoCliente | null {
    return this.galeria?.laudo_tecnico ?? null;
  }

  totalFotos(): number {
    return this.fotosEntrada().length + this.fotosFinalizacao().length;
  }

  private montarMensagemErro(error: unknown): string {
    if (error instanceof GaleriaClienteErro) {
      if (error.status === 404) {
        return 'Nao encontramos a galeria desta ordem de servico.';
      }

      if (error.status === 403) {
        return 'Esta galeria pertence a outro cliente ou nao esta liberada para este acesso.';
      }

      if (error.status === 400) {
        return error.message || 'A galeria fica disponivel apenas quando o servico esta finalizado.';
      }
    }

    return 'Nao foi possivel carregar a galeria desta OS.';
  }

  tempoExecucao(): string {
    const minutos = this.laudoTecnico()?.tempo_execucao_minutos;
    return minutos === null || minutos === undefined ? 'Nao informado' : `${minutos} min`;
  }

  statusFinalClasse(): string {
    const status = this.laudoTecnico()?.status_final;
    const mapa: Record<string, string> = {
      FINALIZADO: 'status-finalizado',
      CANCELADO: 'status-cancelado',
      BLOQUEADO_INCIDENTE: 'status-incidente',
    };
    return mapa[status ?? ''] ?? 'status-neutro';
  }

  statusFinalDescricao(): string {
    const status = this.laudoTecnico()?.status_final;
    const mapa: Record<string, string> = {
      FINALIZADO: 'Aguardando a retirada',
      CANCELADO: 'Atendimento cancelado',
      BLOQUEADO_INCIDENTE: 'Atendimento em analise operacional',
    };
    return mapa[status ?? ''] ?? 'Status atualizado';
  }

  formatarMomentoFoto(momento: string): string {
    const mapa: Record<string, string> = {
      VISTORIA_INICIAL: 'Vistoria inicial',
      VISTORIA_GERAL: 'Vistoria inicial',
      ENTRADA: 'Entrada',
      FINALIZADO: 'Finalizacao',
      FINALIZACAO: 'Finalizacao',
    };
    if (mapa[momento]) return mapa[momento];

    const texto = momento.toLowerCase().replace(/_/g, ' ');
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  ampliarFoto(url: string): void {
    this.fotoAmpliada = url;
    this.cdr.markForCheck();
  }

  fecharFoto(): void {
    this.fotoAmpliada = null;
    this.cdr.markForCheck();
  }

  voltar(): void {
    this.location.back();
  }

  sair(): void {
    const urlParts = this.router.url.split('/');
    const slug = urlParts[2];
    this.router.navigate([`/agendar/${slug}`]);
  }
}
