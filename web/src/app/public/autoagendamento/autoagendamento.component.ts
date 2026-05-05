import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
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
  carregandoHorarios = false;
  enviando = false;
  erro = false;
  naoEncontrado = false;

  // Navegação
  passo = 1;

  estabelecimento: EstabelecimentoPublico | null = null;
  servicoSelecionado: ServicoPublico | null = null;

  // Motor de Disponibilidade
  private _dataSelecionada: any = null;
  horarioSelecionado: string | null = null;
  datasDisponiveis: any[] = [];
  horariosDisponiveis: any[] = [];

  // Dados para RF-23 (Checkout)[cite: 8]
  dadosAgendamento = {
    placa: '',
    modelo: '',
    cor: '',
    nome: '',
    whatsapp: ''
  };

  coresDisponiveis = ['Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho', 'Azul', 'Bege', 'Verde', 'Amarelo', 'Outro'];

  // Calendário Mensal[cite: 1]
  dataAtualExibida = new Date();
  diasDoMes: any[] = [];
  nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: AutoagendamentoPublicoService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.carregarEstabelecimento(slug);
    this.gerarDatas();
  }

  // --- LÓGICA DE NEGÓCIO E BUSCA ---
  private carregarEstabelecimento(slug: string): void {
    this.service.getEstabelecimento(slug).subscribe({
      next: (est) => {
        this.estabelecimento = est;
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.carregando = false;
        this.erro = true;
        if (err.status === 404) this.naoEncontrado = true;
        this.cdr.markForCheck();
      },
    });
  }

  carregarHorarios(): void {
    if (!this.servicoSelecionado || !this.dataSelecionada) return;
    this.carregandoHorarios = true;
    this.horarioSelecionado = null;

    const d = this.dataSelecionada.objeto;
    const dataIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const slug = this.estabelecimento?.slug || this.route.snapshot.paramMap.get('slug') || '';

    this.service.getDisponibilidade(slug, this.servicoSelecionado.id, dataIso).subscribe({
      next: (horarios) => {
        this.horariosDisponiveis = horarios;
        this.carregandoHorarios = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.carregandoHorarios = false;
        this.cdr.markForCheck();
      }
    });
  }

  // --- MÁSCARAS DE INPUT[cite: 8] ---
  onInputPlaca(event: any): void {
    const input = event.target as HTMLInputElement;
    let v = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.length > 7) v = v.substring(0, 7);
    if (v.length > 3) v = v.substring(0, 3) + '-' + v.substring(3);
    this.dadosAgendamento.placa = v;
    input.value = v;
  }

  onInputWhatsApp(event: any): void {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    this.dadosAgendamento.whatsapp = v;
    input.value = v;
  }

  // --- RF-23: CHECKOUT ---
  confirmarAgendamento(): void {
    if (!this.podeFinalizar || this.enviando) return;
    this.enviando = true;
    this.cdr.markForCheck();

    const payload = {
      slug: this.estabelecimento?.slug,
      servico_id: this.servicoSelecionado?.id,
      data_hora: this.gerarDataHoraISO(),
      placa: this.dadosAgendamento.placa,
      modelo: this.dadosAgendamento.modelo,
      cor: this.dadosAgendamento.cor,
      nome_cliente: this.dadosAgendamento.nome || 'Cliente Portal',
      whatsapp: this.dadosAgendamento.whatsapp.replace(/\D/g, '')
    };

    this.service.finalizarCheckout(payload)
      .pipe(finalize(() => {
        this.enviando = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          // Salvar nome do cliente no sessionStorage para o painel usar
          sessionStorage.setItem('clienteNome', this.dadosAgendamento.nome);
          const slug = this.estabelecimento?.slug;
          this.router.navigate([`/agendar/${slug}/cliente/setup`], {
            queryParams: {
              placa: this.dadosAgendamento.placa,
              telefone: payload.whatsapp
            }
          });
        },
        error: (err: any) => {
          alert(err.error?.detail || 'Erro ao processar agendamento.');
        }
      });
  }

  private gerarDataHoraISO(): string {
    const d = this.dataSelecionada.objeto;
    const [h, m] = this.horarioSelecionado!.split(':');
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), Number(h), Number(m)).toISOString();
  }

  get podeFinalizar(): boolean {
    const d = this.dadosAgendamento;
    return !!(d.placa.length >= 8 && d.modelo && d.cor && d.nome && d.whatsapp.length >= 14);
  }

  // --- CALENDÁRIO E DATA[cite: 1] ---
  get dataSelecionada(): any { return this._dataSelecionada; }
  set dataSelecionada(valor: any) {
    if (this._dataSelecionada !== valor) {
      this._dataSelecionada = valor;
      this.horarioSelecionado = null;
      this.carregarHorarios();
    }
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
    this._dataSelecionada = this.datasDisponiveis[0];
    this.gerarCalendario();
  }

  gerarCalendario() {
    this.diasDoMes = [];
    const ano = this.dataAtualExibida.getFullYear();
    const mes = this.dataAtualExibida.getMonth();
    const primeiroDiaMes = new Date(ano, mes, 1).getDay();
    const ultimoDiaMes = new Date(ano, mes + 1, 0).getDate();

    for (let i = 0; i < primeiroDiaMes; i++) this.diasDoMes.push(null);
    for (let i = 1; i <= ultimoDiaMes; i++) {
      const d = new Date(ano, mes, i);
      this.diasDoMes.push({
        objeto: d,
        dia: i,
        hoje: this.isHoje(d),
        selecionado: this.isSelecionado(d),
        passado: this.isPassado(d)
      });
    }
    this.cdr.markForCheck();
  }

  isPassado(d: Date): boolean {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return d < hoje;
  }

  isHoje(d: Date): boolean {
    const hoje = new Date();
    return d.getDate() === hoje.getDate() && d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  }

  isSelecionado(d: Date): boolean {
    if (!this.dataSelecionada) return false;
    const sel = this.dataSelecionada.objeto;
    return d.getDate() === sel.getDate() && d.getMonth() === sel.getMonth() && d.getFullYear() === sel.getFullYear();
  }

  mudarMes(delta: number) {
    this.dataAtualExibida = new Date(this.dataAtualExibida.getFullYear(), this.dataAtualExibida.getMonth() + delta, 1);
    this.gerarCalendario();
  }

  get mesAtualNome(): string {
    return this.dataAtualExibida.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  selecionarData(dia: any) {
    if (!dia || dia.passado || this.isSelecionado(dia.objeto)) return;
    this.dataSelecionada = {
      objeto: dia.objeto,
      dia: dia.dia,
      mes: dia.objeto.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      semana: dia.objeto.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
    };
    this.gerarCalendario();
  }

  // --- NAVEGAÇÃO ---
  get servicos(): ServicoPublico[] { return this.estabelecimento?.servicos ?? []; }

  selecionarServico(servico: ServicoPublico): void {
    if (this.servicoSelecionado?.id === servico.id) return;
    this.servicoSelecionado = servico;
    this.horarioSelecionado = null;
    this.carregarHorarios();
    this.cdr.markForCheck();
  }

  avancar(): void {
    if (this.passo === 1 && this.horarioSelecionado) {
      this.passo = 2;
      window.scrollTo(0, 0);
      this.cdr.markForCheck();
    }
  }

  voltar(): void {
    if (this.passo > 1) {
      this.passo = 1;
      this.cdr.markForCheck();
    }
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
