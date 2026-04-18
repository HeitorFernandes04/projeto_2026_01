import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ServicoService, Servico } from '../../services/servico.service';
import { EstabelecimentoService, Estabelecimento } from '../../services/estabelecimento.service';

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

  // Funcionários (Mock conforme RF-12)
  funcionarios = [
    { nome: 'Carlos Silva', email: 'carlos.silva@lavame.com.br', cargo: 'Lavador', tempoMedio: '38min', eficiencia: 118, tendencia: 'up', ativo: true },
    { nome: 'João Santos', email: 'joao.santos@lavame.com.br', cargo: 'Detalhista', tempoMedio: '42min', eficiencia: 107, tendencia: 'up', ativo: true },
    { nome: 'Maria Oliveira', email: 'maria.oliveira@lavame.com.br', cargo: 'Lavador', tempoMedio: '48min', eficiencia: 94, tendencia: 'down', ativo: true },
    { nome: 'Pedro Costa', email: 'pedro.costa@lavame.com.br', cargo: 'Lavador', tempoMedio: '55min', eficiencia: 82, tendencia: 'down', ativo: false },
    { nome: 'Ana Lima', email: 'ana.lima@lavame.com.br', cargo: 'Detalhista', tempoMedio: '40min', eficiencia: 113, tendencia: 'up', ativo: true }
  ];

  constructor(
    private router: Router,
    private servicoService: ServicoService,
    private estabelecimentoService: EstabelecimentoService
  ) {}

  ngOnInit() {
    this.carregarServicos();
    this.carregarDadosUnidade();
  }

  /**
   * Busca os serviços cadastrados no backend Django
   */
  carregarServicos() {
    this.servicoService.listarServicos().subscribe({
      next: (servicos) => {
        console.log('Dados Recebidos:', servicos);
        this.servicos = servicos;
      },
      error: (err) => {
        console.error('Erro ao carregar serviços:', err);
      }
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

  abrirModal() {
    this.resetarFormulario();
    this.modoEdicao = false;
    this.servicoEmEdicao = null;
    this.exibirModal = true;
  }

  editarServico(servico: Servico) {
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
    this.erroValidacao = '';
    this.modoEdicao = false;
    this.servicoEmEdicao = null;
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
}