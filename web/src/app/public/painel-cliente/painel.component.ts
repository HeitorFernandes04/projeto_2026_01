import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StatusAtivoComponent } from './componentes/status-ativo/status-ativo.component';
import { CardAtivoComponent } from './componentes/card-ativo/card-ativo.component';
import { CardHistoricoComponent } from './componentes/card-historico/card-historico.component';
import {
  PainelClienteService,
  OrdemServicoCliente,
  GrupoEstabelecimento,
  HistoricoMeta,
} from '../../services/painel-cliente.service';
import { AuthB2CService } from '../../services/auth-b2c.service';
import { Subscription } from 'rxjs';

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
export class PainelComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly painelClienteService = inject(PainelClienteService);
  private readonly authB2CService = inject(AuthB2CService);
  private readonly cdr = inject(ChangeDetectorRef);

  clienteNome = '';
  abaAtiva: 'ativos' | 'historico' = 'ativos';
  ordensAtivas: OrdemServicoCliente[] = [];
  ordensFinalizadas: OrdemServicoCliente[] = [];
  gruposAtivos: GrupoEstabelecimento[] = [];
  gruposHistorico: GrupoEstabelecimento[] = [];
  historicoMeta: HistoricoMeta | null = null;
  carregando = true;
  erro = '';

  private readonly subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.subscriptions.push(
      this.painelClienteService.getDadosPainel().subscribe({
        next: (dados) => {
          this.clienteNome = dados.cliente_nome;
          this.ordensAtivas = dados.ativos;
          this.ordensFinalizadas = dados.historico;
          this.gruposAtivos = this.agruparPorEstabelecimento(dados.ativos);
          this.gruposHistorico = this.agruparPorEstabelecimento(dados.historico);
          this.historicoMeta = dados.historico_meta ?? null;
          this.carregando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.erro = 'Não foi possível carregar seus dados. Tente novamente.';
          this.carregando = false;
          this.cdr.markForCheck();
        },
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  logout(): void {
    this.authB2CService.logout();
    const urlParts = this.router.url.split('/');
    const slug = urlParts[2];
    this.router.navigate([`/agendar/${slug}`]);
  }

  getStatusText(status: string): string {
    const mapa: { [key: string]: string } = {
      'PATIO': 'Veículo Recebido',
      'VISTORIA_INICIAL': 'Check-list em andamento',
      'EM_EXECUCAO': 'Limpando seu veículo',
      'LIBERACAO': 'Pronto para retirada',
      'FINALIZADO': 'Serviço concluído',
    };
    return mapa[status] || 'Status desconhecido';
  }

  private agruparPorEstabelecimento(ordens: OrdemServicoCliente[]): GrupoEstabelecimento[] {
    const grupos = new Map<string, GrupoEstabelecimento>();
    for (const os of ordens) {
      const chave = os.estabelecimento?.slug ?? os.estabelecimento?.nome_fantasia ?? 'sem-estabelecimento';
      if (!grupos.has(chave)) {
        grupos.set(chave, {
          nome_fantasia: os.estabelecimento?.nome_fantasia ?? 'Estabelecimento',
          slug: os.estabelecimento?.slug ?? '',
          ordens: [],
        });
      }
      grupos.get(chave)!.ordens.push(os);
    }
    return Array.from(grupos.values());
  }
}
