import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StatusAtivoComponent } from './componentes/status-ativo/status-ativo.component';
import { CardAtivoComponent } from './componentes/card-ativo/card-ativo.component';
import { CardHistoricoComponent } from './componentes/card-historico/card-historico.component';
import { PainelClienteService } from '../../services/painel-cliente.service';
import { AuthB2CService } from '../../services/auth-b2c.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-painel',
  standalone: true,
  imports: [
    CommonModule,
    StatusAtivoComponent,
    CardAtivoComponent,
    CardHistoricoComponent
  ],
  templateUrl: './painel.component.html',
  styleUrls: ['./painel.component.scss']
})
export class PainelComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private painelClienteService = inject(PainelClienteService);
  private authB2CService = inject(AuthB2CService);
  private cdr = inject(ChangeDetectorRef);

  dados: any = null;
  abaAtiva: 'ativos' | 'historico' = 'ativos';
  ordensAtivas: any[] = [];
  ordensFinalizadas: any[] = [];
  carregando = true;
  erro = '';

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.subscriptions.push(
      this.painelClienteService.getDadosPainel().subscribe({
        next: (dados) => {
          this.dados = dados;
          this.ordensAtivas = dados.ativos;
          this.ordensFinalizadas = dados.historico;
          this.carregando = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.erro = 'Nao foi possivel carregar seu painel.';
          this.carregando = false;
          this.cdr.detectChanges();
        }
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

  verDetalhes(id: number): void {
    console.log('Ver detalhes do veiculo:', id);
  }

  getStatusText(status: string): string {
    const mapa: { [key: string]: string } = {
      'PATIO': 'Veiculo Recebido',
      'VISTORIA_INICIAL': 'Check-list em andamento',
      'EM_EXECUCAO': 'Limpando seu veiculo',
      'LIBERACAO': 'Pronto para retirada',
      'FINALIZADO': 'Servico concluido'
    };
    return mapa[status] || 'Status desconhecido';
  }
}
