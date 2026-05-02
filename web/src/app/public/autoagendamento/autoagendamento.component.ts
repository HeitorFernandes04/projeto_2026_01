import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  AutoagendamentoPublicoService,
  EstabelecimentoPublico,
  ServicoPublico,
} from '../../services/autoagendamento-publico.service';

@Component({
  selector: 'app-autoagendamento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './autoagendamento.component.html',
  styleUrl: './autoagendamento.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoagendamentoComponent implements OnInit {
  // Estados da tela
  carregando = true;
  erro = false;
  naoEncontrado = false;
  
  // Navegação (RF-21 a RF-26)
  passo = 1; 

  estabelecimento: EstabelecimentoPublico | null = null;
  servicoSelecionado: ServicoPublico | null = null;
  
  // Mock para RF-22 (Horários)
  dataSelecionada: any = null;
  horarioSelecionado: string | null = null;
  datasDisponiveis: any[] = [];
  horariosDisponiveis = ['08:00', '09:30', '11:00', '14:00', '15:30', '17:00'];

  // Mock para RF-23 (Checkout)
  dadosAgendamento = {
    placa: '',
    modelo: '',
    cor: '',
    nome: '',
    whatsapp: ''
  };

  coresDisponiveis = [
    { value: 'BRANCO', label: 'Branco' },
    { value: 'PRETO', label: 'Preto' },
    { value: 'CINZA', label: 'Cinza' },
    { value: 'PRATA', label: 'Prata' },
    { value: 'VERMELHO', label: 'Vermelho' },
    { value: 'AZUL', label: 'Azul' },
    { value: 'VERDE', label: 'Verde' },
    { value: 'AMARELO', label: 'Amarelo' },
    { value: 'OUTRO', label: 'Outro' },
  ];

  // Mock para RF-24/25/26 (Status)
  statusAgendamento = 'PATIO'; // PATIO, EM_EXECUCAO, FINALIZADO
  galeria: any[] = [];
  osIdParaGaleria = 123; // Mock de ID vindo do agendamento real

  constructor(
    private readonly route: ActivatedRoute,
    private readonly service: AutoagendamentoPublicoService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  onInputPlaca(event: any): void {
    const input = event.target as HTMLInputElement;
    let v = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.length > 7) v = v.substring(0, 7);
    if (v.length > 3) {
      v = v.substring(0, 3) + '-' + v.substring(3);
    }
    this.dadosAgendamento.placa = v;
    input.value = v;
  }

  onInputWhatsApp(event: any): void {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);
    
    if (v.length > 10) {
      v = v.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (v.length > 6) {
      v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (v.length > 2) {
      v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    }
    this.dadosAgendamento.whatsapp = v;
    input.value = v;
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.carregarEstabelecimento(slug);
    this.gerarDatas();
    
    // Simulação: Se cair direto no status FINALIZADO, carrega a galeria
    if (this.statusAgendamento === 'FINALIZADO') {
      this.carregarGaleria();
    }
  }

  private carregarGaleria(): void {
    this.service.getGaleria(this.osIdParaGaleria).subscribe({
      next: (midias) => {
        this.galeria = midias;
        this.cdr.markForCheck();
      }
    });
  }

  private gerarDatas() {
    const hoje = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(hoje.getDate() + i);
      this.datasDisponiveis.push({
        objeto: d,
        dia: d.getDate(),
        mes: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        semana: i === 0 ? 'Hoje' : d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
      });
    }
    this.dataSelecionada = this.datasDisponiveis[0];
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

  // Propriedades expostas ao template
  get servicos(): ServicoPublico[] {
    return this.estabelecimento?.servicos ?? [];
  }

  get podeAvancar(): boolean {
    if (this.passo === 1) return this.servicoSelecionado !== null;
    if (this.passo === 2) return this.horarioSelecionado !== null;
    if (this.passo === 3) return !!(this.dadosAgendamento.placa && this.dadosAgendamento.whatsapp && this.dadosAgendamento.cor);
    return true;
  }

  selecionarServico(servico: ServicoPublico): void {
    this.servicoSelecionado = servico;
    this.cdr.markForCheck();
  }

  avancar(): void {
    if (this.podeAvancar && this.passo < 4) {
      this.passo++;
      window.scrollTo(0, 0);
      this.cdr.markForCheck();
    }
  }

  voltar(): void {
    if (this.passo > 1) {
      this.passo--;
      this.cdr.markForCheck();
    }
  }

  finalizarAgendamento(): void {
    // Simulação para fins de teste da Galeria RF-26
    this.statusAgendamento = 'FINALIZADO';
    this.carregarGaleria();
    this.avancar(); // Move para o passo 4 (Sucesso)
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
