import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
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

  constructor(
    private router: Router,
    private location: Location,
    private route: ActivatedRoute,
    private painelClienteService: PainelClienteService,
    private cdr: ChangeDetectorRef,
  ) {}

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
      error: () => {
        this.erro = 'Nao foi possivel carregar a galeria desta OS.';
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
