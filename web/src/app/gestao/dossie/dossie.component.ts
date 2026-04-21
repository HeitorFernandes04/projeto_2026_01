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

  voltar(): void {
    this.router.navigate(['/gestao/historico']);
  }

  irParaIncidentes(): void {
    this.router.navigate(['/gestao/incidentes']);
  }
}
