import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  AutoagendamentoPublicoService,
  EstabelecimentoPublico,
  ServicoPublico,
} from '../../services/autoagendamento-publico.service';

@Component({
  selector: 'app-autoagendamento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './autoagendamento.component.html',
  styleUrl: './autoagendamento.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoagendamentoComponent implements OnInit {
  // Estados da tela
  carregando = true;
  erro = false;
  naoEncontrado = false;

  estabelecimento: EstabelecimentoPublico | null = null;
  servicoSelecionado: ServicoPublico | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly service: AutoagendamentoPublicoService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.carregarEstabelecimento(slug);
  }

  private carregarEstabelecimento(slug: string): void {
    this.service.getEstabelecimento(slug).subscribe({
      next: (est) => {
        this.estabelecimento = est;
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.carregando = false;
        this.erro = true;
        if (err.status === 404) {
          this.naoEncontrado = true;
        }
        this.cdr.markForCheck();
      },
    });
  }

  // Propriedades expostas ao template (CA-07: CTA só habilita com seleção)
  get servicos(): ServicoPublico[] {
    return this.estabelecimento?.servicos ?? [];
  }

  get podeAvancar(): boolean {
    return this.servicoSelecionado !== null;
  }

  selecionarServico(servico: ServicoPublico): void {
    this.servicoSelecionado = servico;
    this.cdr.markForCheck();
  }

  continuarAgendamento(): void {
    if (!this.podeAvancar) return;
    // RF-22: Navegação para seleção de horário (próxima sprint)
    console.log('Serviço selecionado:', this.servicoSelecionado);
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarDuracao(minutos: number): string {
    if (minutos < 60) return `${minutos} min`;
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
}
