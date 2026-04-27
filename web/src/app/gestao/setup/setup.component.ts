import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { ServicoService, Servico } from '../../services/servico.service';
import { EstabelecimentoService, Estabelecimento } from '../../services/estabelecimento.service';
import { FuncionarioService, Funcionario } from '../../services/funcionario.service';
import { DashboardService } from '../../services/dashboard.service';
import { IncidentesService } from '../../services/incidentes.service';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.scss'
})
export class SetupComponent implements OnInit, OnDestroy {
  // Estado da Lista de Serviços (Dados Reais do Banco)
  servicos: Servico[] = [];

  // Objeto vinculado ao formulário do Modal (RF-11)
  novoServico: Servico = {
    nome: '',
    preco: 0,
    duracao_estimada_minutos: 0,
    is_active: true
  };

  erroValidacao: string = '';
  erroUnidade: string = '';
  sucessoUnidade: string = '';
  salvandoUnidade: boolean = false;
  abaAtiva: 'servicos' | 'funcionarios' | 'unidade' = 'servicos';
  exibirModal: boolean = false;
  tipoModal: 'servico' | 'funcionario' = 'servico';
  
  // Controle de edição
  servicoEmEdicao: Servico | null = null;
  modoEdicao: boolean = false;

  // Estado da Unidade (RF-13 - Dados Reais do Banco)
  unidade: Estabelecimento = {
    id: 0,
    nome_fantasia: '',
    cnpj: '',
    endereco_completo: '',
    is_active: true
  };

  // Dados complementares para UI
  linkAgendamento: string = 'https://lavame.com.br/agendar/unidade-centro';

  // Funcionários (RF-12)
  funcionarios: Funcionario[] = [];
  novoFuncionario: Funcionario = {
    name: '',
    email: '',
    password: '',
    username: '',
    cargo: 'LAVADOR'
  };
  cargosDisponiveis = ['LAVADOR', 'DETALHISTA'];
  exibirInativos: boolean = false;
  funcionarioEmEdicao: Funcionario | null = null;

  // Performance da Equipe (RF-20)
  performanceGlobalMinutos: number = 0;
  totalIncidentesPendentes: number = 0;
  private readonly subscriptions = new Subscription();

  get dataHoje(): string {
    const data = new Date();
    return data
      .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
      .replaceAll('.', '')
      .toUpperCase();
  }
  
  constructor(
    private router: Router,
    private servicoService: ServicoService,
    private estabelecimentoService: EstabelecimentoService,
    private funcionarioService: FuncionarioService,
    private dashboardService: DashboardService,
    private incidentesService: IncidentesService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.monitorarIncidentesPendentes();
    this.carregarServicos();
    this.carregarDadosUnidade();
    this.carregarFuncionarios();
    this.carregarPerformanceEquipe();
  }

  ngOnDestroy() {
    this.incidentesService.pararMonitoramentoPendentes();
    this.subscriptions.unsubscribe();
  }

  private monitorarIncidentesPendentes() {
    this.subscriptions.add(
      this.incidentesService.totalPendentes$.subscribe((total) => {
        this.totalIncidentesPendentes = total;
        this.cdRef.detectChanges();
      }),
    );
    this.incidentesService.iniciarMonitoramentoPendentes();
  }

  carregarPerformanceEquipe() {
    this.dashboardService.getEficienciaEquipe().subscribe({
      next: (dados) => {
        let desvioTotal = 0;
        dados.forEach(d => desvioTotal += d.desvioTotalMinutos);
        this.performanceGlobalMinutos = desvioTotal;
        this.cdRef.detectChanges();
      },
      error: (err) => console.error('Erro performance', err)
    });
  }

  /**
   * Busca os serviços cadastrados no backend Django
   */
  carregarServicos() {
    this.servicoService.listarServicos().subscribe({
      next: (dados) => {
        this.servicos = dados;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar serviços:', err);
        this.cdRef.detectChanges();
      }
    });
  }

  /**
   * Busca funcionários vinculados à unidade (RF-12)
   */
  carregarFuncionarios() {
    this.funcionarioService.listarFuncionarios().subscribe({
      next: (dados) => {
        this.funcionarios = dados;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar funcionários:', err);
        this.cdRef.detectChanges();
      }
    });
  }

  /**
   * Carrega dados da unidade (RF-13)
   */
  carregarDadosUnidade() {
    this.estabelecimentoService.obterDadosEstabelecimento().subscribe({
      next: (dados) => {
        if (dados) {
          this.unidade = {
            ...dados,
            cnpj: this.aplicarMascaraCNPJ(dados.cnpj)
          };
        }
        this.cdRef.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar dados da unidade:', err);
        this.cdRef.detectChanges();
      }
    });
  }

  /**
   * Atualiza URL de agendamento baseada no nome da unidade (CA-05)
   */
  private atualizarLinkAgendamento() {
    if (this.unidade.nome_fantasia) {
      const nomeFormatado = this.unidade.nome_fantasia
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      this.linkAgendamento = `https://lavame.com.br/agendar/${nomeFormatado}`;
    }
  }

  // Navegação e UI
  setAba(aba: 'servicos' | 'funcionarios' | 'unidade') { 
    this.abaAtiva = aba; 
    // Recarrega dados ao trocar de aba para garantir atualização
    if (aba === 'servicos') this.carregarServicos();
    if (aba === 'funcionarios') this.carregarFuncionarios();
    if (aba === 'unidade') this.carregarDadosUnidade();
  }

  abrirModal(tipo: 'servico' | 'funcionario' = 'servico') {
    this.resetarFormulario();
    this.tipoModal = tipo;
    this.modoEdicao = false;
    this.servicoEmEdicao = null;
    this.funcionarioEmEdicao = null;
    this.exibirModal = true;
  }

  editarFuncionario(funcionario: Funcionario) {
    this.tipoModal = 'funcionario';
    this.funcionarioEmEdicao = funcionario;
    this.modoEdicao = true;
    this.novoFuncionario = { 
      ...funcionario, 
      password: '' // Senha fica vazia por segurança na edição
    };
    this.exibirModal = true;
  }

  editarServico(servico: Servico) {
    this.tipoModal = 'servico';
    this.servicoEmEdicao = servico;
    this.modoEdicao = true;
    this.novoServico = { ...servico };
    this.exibirModal = true;
  }

  fecharModal() {
    this.exibirModal = false;
    this.resetarFormulario();
  }

  resetarFormulario() {
    this.novoServico = { nome: '', preco: 0, duracao_estimada_minutos: 0, is_active: true };
    this.novoFuncionario = { name: '', email: '', password: '', username: '', cargo: 'LAVADOR' };
    this.erroValidacao = '';
    this.modoEdicao = false;
    this.servicoEmEdicao = null;
    this.funcionarioEmEdicao = null;
  }

  copiarLink() {
    navigator.clipboard.writeText(this.linkAgendamento);
  }

  /**
   * Salva dados da unidade (RF-13)
   * CORREÇÃO: Envio limpo sem ID na URL para evitar erro 404
   */
  salvarUnidade() {
    this.erroUnidade = '';
    this.sucessoUnidade = '';

    // Validações básicas (CA-01 Adaptado)
    if (!this.unidade.nome_fantasia.trim()) {
      this.erroUnidade = 'O nome fantasia é obrigatório.';
      return;
    }

    const cnpjLimpo = this.unidade.cnpj.replace(/\D/g, '');
    if (!cnpjLimpo || cnpjLimpo.length !== 14) {
      this.erroUnidade = 'O CNPJ deve conter 14 dígitos.';
      return;
    }

    // Inicia estado de carregamento apenas se passar na validação
    this.salvandoUnidade = true;

    // Prepara payload conforme RF-13
    const dadosAtualizacao: Partial<Estabelecimento> = {
      nome_fantasia: this.unidade.nome_fantasia.trim(),
      cnpj: cnpjLimpo,
      endereco_completo: this.unidade.endereco_completo.trim()
    };

    // Chamada ao serviço com finalize para garantir que o botão destrave sempre
    this.estabelecimentoService.atualizarDadosEstabelecimento(dadosAtualizacao)
      .pipe(
        finalize(() => {
          this.salvandoUnidade = false;
          this.cdRef.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.unidade = {
            ...res,
            cnpj: this.aplicarMascaraCNPJ(res.cnpj)
          };
          this.atualizarLinkAgendamento();
          this.sucessoUnidade = 'Dados da unidade atualizados com sucesso!';

          setTimeout(() => {
            this.sucessoUnidade = '';
            this.cdRef.detectChanges();
          }, 3000);
        },
        error: (err) => {
          console.error('Erro ao salvar unidade:', err);
          this.erroUnidade = 'Não foi possível salvar os dados. Tente novamente.';
        }
      });
  }

  irParaIncidentes() {
    this.router.navigate(['/gestao/incidentes']);
  }

  /**
   * Validação conforme CA-01
   */
  validarFormulario(): boolean {
    this.erroValidacao = '';

    if (!this.novoServico.nome || !this.novoServico.nome.trim()) {
      this.erroValidacao = 'O nome do serviço é obrigatório.';
      return false;
    }

    if (this.novoServico.preco <= 0) {
      this.erroValidacao = 'O preço deve ser um valor positivo.';
      return false;
    }

    if (!this.novoServico.duracao_estimada_minutos || this.novoServico.duracao_estimada_minutos <= 0) {
      this.erroValidacao = 'A duração estimada é obrigatória (mínimo 1 minuto).';
      return false;
    }

    this.novoServico.duracao_estimada_minutos = Math.floor(this.novoServico.duracao_estimada_minutos);
    return true;
  }

  salvarServico() {
    if (!this.validarFormulario()) {
      return;
    }

    if (this.modoEdicao && this.servicoEmEdicao?.id) {
      // Modo de edição - PATCH
      this.servicoService.atualizarServico(this.servicoEmEdicao.id, this.novoServico).subscribe({
        next: () => {
          this.fecharModal();
          this.carregarServicos();
        },
        error: (err) => {
          console.error('Erro ao atualizar serviço:', err);
          this.erroValidacao = 'Erro ao atualizar serviço.';
        }
      });
    } else {
      // Modo de criação - POST
      this.servicoService.criarServico(this.novoServico).subscribe({
        next: () => {
          this.fecharModal();
          this.carregarServicos();
        },
        error: (err) => {
          console.error('Erro ao criar serviço:', err);
          this.erroValidacao = 'Erro de comunicação com o servidor.';
        }
      });
    }
  }

  excluirServico(id: number | undefined) {
    if (!id) return;

    if (confirm('Deseja realmente remover este serviço? O histórico de ordens anteriores será preservado.')) {
      this.servicoService.deletarServico(id).subscribe({
        next: () => {
          this.carregarServicos();
          this.cdRef.detectChanges();
        },
        error: (err) => {
          console.error('Erro ao excluir serviço:', err);
        }
      });
    }
  }

  /**
   * Lógica de Funcionários (RF-12)
   */
  salvarGeral() {
    if (this.tipoModal === 'servico') {
      this.salvarServico();
    } else {
      this.salvarFuncionario();
    }
  }

  validarFormFuncionario(): boolean {
    if (!this.novoFuncionario.name || !this.novoFuncionario.email) {
      this.erroValidacao = 'Nome e E-mail são obrigatórios.';
      return false;
    }
    if (!this.modoEdicao && !this.novoFuncionario.password) {
      this.erroValidacao = 'A senha é obrigatória para novos cadastros.';
      return false;
    }
    if (!this.novoFuncionario.username) {
      this.novoFuncionario.username = this.novoFuncionario.email;
    }
    return true;
  }

  salvarFuncionario() {
    if (!this.validarFormFuncionario()) return;

    if (this.modoEdicao && this.funcionarioEmEdicao?.id) {
      // Edição via PATCH - Enviamos apenas o que pode ter mudado
      const payload: any = {
        name: this.novoFuncionario.name,
        email: this.novoFuncionario.email,
        cargo: this.novoFuncionario.cargo,
        is_active: this.novoFuncionario.is_active
      };

      // Só envia a senha se o usuário digitou algo
      if (this.novoFuncionario.password && this.novoFuncionario.password.trim().length >= 6) {
        payload.password = this.novoFuncionario.password;
      }

      this.funcionarioService.atualizarFuncionario(this.funcionarioEmEdicao.id, payload).subscribe({
        next: () => {
          this.fecharModal();
          this.carregarFuncionarios();
        },
        error: (err) => {
          console.error('Erro ao atualizar colaborador:', err);
          this.erroValidacao = 'Erro ao atualizar colaborador. Verifique os dados.';
        }
      });
    } else {
      // Criação via POST
      this.funcionarioService.criarFuncionario(this.novoFuncionario).subscribe({
        next: () => {
          this.fecharModal();
          this.carregarFuncionarios();
        },
        error: (err) => {
          this.erroValidacao = err.error?.email?.[0] || 'Erro ao cadastrar funcionário. Verifique se o e-mail já existe.';
        }
      });
    }
  }


  get funcionariosFiltrados(): Funcionario[] {
    if (this.exibirInativos) {
      // Prioriza ativos no topo
      return [...this.funcionarios].sort((a, b) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0));
    }
    return this.funcionarios.filter(f => f.is_active);
  }

  get totalAtivos(): number {
    return this.funcionarios.filter(f => f.is_active).length;
  }

  toggleExibirInativos() {
    this.exibirInativos = !this.exibirInativos;
    this.carregarFuncionarios();
  }

  onToggleChange(valor: boolean) {
    this.exibirInativos = valor;
    this.carregarFuncionarios();
  }

  getUltimaAtividade(funcionario: any): string {
    if (!funcionario) return '--';

    // Prioridade 1: Último Login
    if (funcionario.last_login) {
      try {
        const lastLogin = new Date(funcionario.last_login);
        const agora = new Date();
        const diffMs = agora.getTime() - lastLogin.getTime();
        
        if (!isNaN(diffMs)) {
          const diffMin = Math.floor(diffMs / (1000 * 60));
          const diffHoras = Math.floor(diffMin / 60);
          const diffDias = Math.floor(diffHoras / 24);

          if (diffMin < 1) return 'Acessou agora';
          if (diffMin < 60) return `Há ${diffMin}min`;
          if (diffHoras < 24) return `Há ${diffHoras}h`;
          if (diffDias === 1) return 'Ontem';
          if (diffDias < 30) return `Há ${diffDias}d`;
        }
      } catch (e) {}
    }

    // fallback: Data de cadastro (date_joined)
    if (funcionario.date_joined) {
      try {
        const dateJoined = new Date(funcionario.date_joined);
        if (!isNaN(dateJoined.getTime())) {
          return `Início: ${dateJoined.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
        }
      } catch (e) {}
    }

    return 'S/ registro';
  }

  formatarEntradaCNPJ(event: any) {
    const input = event.target as HTMLInputElement;
    const valorComMascara = this.aplicarMascaraCNPJ(input.value);
    this.unidade.cnpj = valorComMascara;
    input.value = valorComMascara; // Força atualização visual
  }

  aplicarMascaraCNPJ(v: string): string {
    if (!v) return '';
    v = v.replace(/\D/g, ''); // Remove tudo que não é dígito
    
    if (v.length > 14) v = v.substring(0, 14);

    if (v.length <= 2) return v;
    if (v.length <= 5) return v.replace(/^(\d{2})(\d)/, '$1.$2');
    if (v.length <= 8) return v.replace(/^(\d{2})(\d{3})(\d)/, '$1.$2.$3');
    if (v.length <= 12) return v.replace(/^(\d{2})(\d{3})(\d{3})(\d)/, '$1.$2.$3/$4');
    return v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d)/, '$1.$2.$3/$4-$5');
  }
}
