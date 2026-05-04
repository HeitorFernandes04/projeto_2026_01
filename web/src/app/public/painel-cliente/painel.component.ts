import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StatusAtivoComponent } from './componentes/status-ativo/status-ativo.component';
import { CardAtivoComponent } from './componentes/card-ativo/card-ativo.component';
import { CardHistoricoComponent } from './componentes/card-historico/card-historico.component';
import { OrdemServicoService, OrdemServico } from './services/ordem-servico.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-painel',
  standalone: true,
  // Removido ListaHistoricoComponent para eliminar o WARNING NG8113
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
  private ordemServicoService = inject(OrdemServicoService);
  private cdr = inject(ChangeDetectorRef);

  dados: any = null;
  abaAtiva: 'ativos' | 'historico' = 'ativos';
  ordensAtivas: OrdemServico[] = [];
  ordensFinalizadas: OrdemServico[] = [];
  
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    // Escutar mudanças nas ordens de serviço (Reatividade Axioma 13)
    this.subscriptions.push(
      this.ordemServicoService.getOrdensServico$().subscribe(() => {
        this.ordensAtivas = this.ordemServicoService.getOrdensAtivas();
        this.ordensFinalizadas = this.ordemServicoService.getOrdensFinalizadas();
        
        this.atualizarDadosPainel();
      })
    );

    // Initial check para garantir renderização correta
    this.atualizarDadosPainel();
  }

  ngOnDestroy(): void {
    // Limpar subscriptions para evitar memory leaks[cite: 1]
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Atualiza os dados do painel baseado nas ordens de serviço
   */
  private atualizarDadosPainel(): void {
    // Busca nome real do cliente do sessionStorage (vindo do formulário RF-23)
    const nomeCliente = sessionStorage.getItem('clienteNome') || 'Cliente';
    
    this.dados = {
      cliente_nome: nomeCliente,
      ativos: this.ordensAtivas,
      historico: this.ordensFinalizadas
    };
    this.cdr.detectChanges();
  }

  /**
   * Como é um link de autoagendamento público, sair retorna para a home da unidade[cite: 2]
   */
  logout(): void {
    const urlParts = this.router.url.split('/');
    const slug = urlParts[2]; // Pega o slug de /agendar/:slug/painel
    this.router.navigate([`/agendar/${slug}`]);
  }

  /**
   * Navega para os detalhes de um veículo ativo
   */
  verDetalhes(id: number): void {
    console.log('Ver detalhes do veículo:', id);
  }

  /**
   * RF-24: Remove a OS cancelada da lista de ordens ativas.
   * Acionado pelo EventEmitter (cancelado) do CardAtivoComponent.
   */
  onAgendamentoCancelado(osId: number): void {
    this.ordemServicoService.removerOrdemAtiva(osId);
    this.cdr.detectChanges();
  }

  /**
   * Retorna o texto do status baseado no código para consistência visual[cite: 1]
   */
  getStatusText(status: string): string {
    const mapa: { [key: string]: string } = {
      'PATIO': 'Veículo Recebido',
      'VISTORIA_INICIAL': 'Check-list em andamento',
      'EM_EXECUCAO': 'Limpando seu veículo',
      'LIBERACAO': 'Pronto para retirada',
      'FINALIZADO': 'Serviço concluído'
    };
    return mapa[status] || 'Status desconhecido';
  }
}
