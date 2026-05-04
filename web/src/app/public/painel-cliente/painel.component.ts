import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StatusAtivoComponent } from './componentes/status-ativo/status-ativo.component';
import { CardAtivoComponent } from './componentes/card-ativo/card-ativo.component';
import { CardHistoricoComponent } from './componentes/card-historico/card-historico.component';
import { OrdemServicoService, OrdemServicoAPI } from './services/ordem-servico.service';

@Component({
  selector: 'app-painel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    StatusAtivoComponent,
    CardAtivoComponent,
    CardHistoricoComponent,
  ],
  templateUrl: './painel.component.html',
  styleUrls: ['./painel.component.scss']
})
export class PainelComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly ordemServicoService = inject(OrdemServicoService);
  private readonly cdr = inject(ChangeDetectorRef);

  clienteNome = '';
  abaAtiva: 'ativos' | 'historico' = 'ativos';
  ordensAtivas: OrdemServicoAPI[] = [];
  ordensFinalizadas: OrdemServicoAPI[] = [];
  carregando = true;
  erro = '';

  ngOnInit(): void {
    this.ordemServicoService.getDadosPainel().subscribe({
      next: (resp) => {
        this.clienteNome = resp.cliente_nome;
        this.ordensAtivas = resp.ativos;
        this.ordensFinalizadas = resp.historico;
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.erro = 'Não foi possível carregar seus dados. Tente novamente.';
        this.carregando = false;
        this.cdr.markForCheck();
      },
    });
  }

  logout(): void {
    const urlParts = this.router.url.split('/');
    const slug = urlParts[2];
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.router.navigate([`/agendar/${slug}`]);
  }

}