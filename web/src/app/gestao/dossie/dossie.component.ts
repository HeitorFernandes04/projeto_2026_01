import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HistoricoService, GaleriaOS } from '../../services/historico.service';

@Component({
  selector: 'app-dossie',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dossie.component.html',
  styleUrl: './dossie.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DossieComponent implements OnInit {
  osId: number | null = null;
  galeria: GaleriaOS = { estado_inicial: [], estado_meio: [], estado_final: [] };
  carregando = true;
  erro = false;

  fotoAmpliada: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly historicoService: HistoricoService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.osId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.osId) this.carregarGaleria();
  }

  carregarGaleria(): void {
    this.historicoService.buscarGaleria(this.osId!).subscribe({
      next: (data) => {
        console.log('Dados da galeria:', data);
        this.galeria    = data;
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.carregando = false;
        this.erro       = true;
        this.cdr.markForCheck();
      },
    });
  }

  ampliarFoto(url: string): void {
    this.fotoAmpliada = url;
    this.cdr.markForCheck();
  }

  fecharFoto(): void {
    this.fotoAmpliada = null;
    this.cdr.markForCheck();
  }

  totalFotos(galeria: GaleriaOS): number {
    return galeria.estado_inicial.length + galeria.estado_meio.length + galeria.estado_final.length;
  }

  formatarTempo(segundos: number | undefined): string {
    if (segundos === undefined) return '';
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  }

  calcularTempoIncidente(inicio: string, fim: string | null): string {
    if (!fim) return 'Em andamento';
    const start = new Date(inicio).getTime();
    const end = new Date(fim).getTime();
    const diffEmSegundos = Math.floor((end - start) / 1000);
    return this.formatarTempo(diffEmSegundos);
  }

  voltar(): void {
    this.router.navigate(['/gestao/historico']);
  }

  irParaIncidentes(): void {
    this.router.navigate(['/gestao/incidentes']);
  }
}
