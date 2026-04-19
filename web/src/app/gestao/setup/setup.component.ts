import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ServicoService, Servico } from '../../services/servico.service';
import { EstabelecimentoService, Estabelecimento } from '../../services/estabelecimento.service';
import { FuncionarioService, Funcionario } from '../../services/funcionario.service';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.scss'
})
export class SetupComponent implements OnInit {
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

  constructor(
    private router: Router,
    private servicoService: ServicoService,
    private estabelecimentoService: EstabelecimentoService,
    private funcionarioService: FuncionarioService
  ) {}

  ngOnInit() {
    this.carregarServicos();
    this.carregarDadosUnidade();
    this.carregarFuncionarios();
  }

  /**
   * Busca os serviços cadastrados no backend Django
   */
  carregarServicos() {
    this.servicoService.listarServicos().subscribe({
      next: (servicos) => {
        this.servicos = servicos;
      },
      error: (err) => {
        console.error('Erro ao carregar serviços:', err);
      }
    });
  }

  /**
   * Busca funcionários vinculados à unidade (RF-12)
   */
  carregarFuncionarios() {
    this.funcionarioService.listarFuncionarios().subscribe({
      next: (f) => this.funcionarios = f,
      error: (err) => console.error('Erro ao carregar equipe:', err)
    });
  }

  /**
   * Carrega dados da unidade (RF-13)
   */
  carregarDadosUnidade() {
    this.estabelecimentoService.obterDadosEstabelecimento().subscribe({
      next: (estabelecimento) => {
        this.unidade = estabelecimento;
        this.atualizarLinkAgendamento();
      },
      error: (err) => {
        console.error('Erro ao carregar dados da unidade:', err);
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
  setAba(aba: 'servicos' | 'funcionarios' | 'unidade') { this.abaAtiva = aba; }

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

    // Prepara payload conforme RF-13
    const dadosAtualizacao: Partial<Estabelecimento> = {
      nome_fantasia: this.unidade.nome_fantasia.trim(),
      cnpj: cnpjLimpo,
      endereco_completo: this.unidade.endereco_completo.trim()
    };

    // Chamada ao serviço
    this.estabelecimentoService.atualizarDadosEstabelecimento(dadosAtualizacao).subscribe({
      next: (res) => {
        this.unidade = res;
        this.atualizarLinkAgendamento();
        this.sucessoUnidade = 'Dados da unidade atualizados com sucesso!';

        setTimeout(() => {
          this.sucessoUnidade = '';
        }, 3000);
      },
      error: (err) => {
        console.error('Erro ao salvar unidade:', err);
        this.erroUnidade = 'Não foi possível salvar. Verifique se a URL da API está correta.';
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
      // Edição via PATCH
      this.funcionarioService.atualizarFuncionario(this.funcionarioEmEdicao.id, this.novoFuncionario).subscribe({
        next: () => {
          this.fecharModal();
          this.carregarFuncionarios();
        },
        error: (err) => {
          this.erroValidacao = 'Erro ao atualizar colaborador. Tente novamente.';
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

  alternarStatusFuncionario(funcionario: Funcionario) {
    if (!funcionario.id) return;
    
    const novoStatus = !funcionario.is_active;
    this.funcionarioService.atualizarFuncionario(funcionario.id, { is_active: novoStatus }).subscribe({
      next: () => this.carregarFuncionarios(),
      error: (err) => {
        console.error('Erro ao mudar status:', err);
        alert('Não foi possível alterar o status do colaborador no momento.');
      }
    });
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

  inativarFuncionario(id: number | undefined) {
    if (!id) return;
    if (confirm('Deseja realmente desativar este funcionário?')) {
      this.funcionarioService.inativarFuncionario(id).subscribe({
        next: () => this.carregarFuncionarios(),
        error: (err) => console.error('Erro ao inativar:', err)
      });
    }
  }
}