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
import { TagPecaService, TagPeca } from '../../services/tag-peca.service';
import { AuthService } from '../../services/auth.service';

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
  abaAtiva: 'servicos' | 'funcionarios' | 'unidade' | 'tags' = 'servicos';
  exibirModal: boolean = false;
  tipoModal: 'servico' | 'funcionario' | 'tag' = 'servico';
  
  // Controle de edição
  servicoEmEdicao: Servico | null = null;
  modoEdicao: boolean = false;

  // Gestão de Logo (RF-21)
  logoParaUpload: File | null = null;
  logoPreview: string | null = null;
  logoRemovida: boolean = false;
  defaultLogo = '/static/assets/logo-lavame.png';

  // Estado da Unidade (RF-13 - Dados Reais do Banco)
  unidade: Estabelecimento = {
    id: 0,
    nome_fantasia: '',
    slug: '',
    cnpj: '',
    endereco_completo: '',
    is_active: true,
    logo_url: ''
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

  // Tags de Peças (RF-21.5)
  tags: TagPeca[] = [];
  novaTag: TagPeca = { nome: '', categoria: 'EXTERNO' };
  tagEmEdicao: TagPeca | null = null;

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
    private tagPecaService: TagPecaService,
    private authService: AuthService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.monitorarIncidentesPendentes();
    this.carregarServicos();
    this.carregarDadosUnidade();
    this.carregarFuncionarios();
    this.carregarTags();
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
          this.atualizarLinkAgendamento();
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
   * Atualiza URL de agendamento baseada no slug da unidade (RF-21)
   */
  private atualizarLinkAgendamento() {
    const slug = this.unidade.slug || '';
    if (slug) {
      const host = window.location.origin;
      this.linkAgendamento = `${host}/agendar/${slug}`;
    } else {
      this.linkAgendamento = 'Slug não definido';
    }
  }

  // Navegação e UI
  setAba(aba: 'servicos' | 'funcionarios' | 'unidade' | 'tags') { 
    this.abaAtiva = aba; 
    // Recarrega dados ao trocar de aba para garantir atualização
    if (aba === 'servicos') this.carregarServicos();
    if (aba === 'funcionarios') this.carregarFuncionarios();
    if (aba === 'unidade') this.carregarDadosUnidade();
    if (aba === 'tags') this.carregarTags();
  }

  abrirModal(tipo: 'servico' | 'funcionario' | 'tag' = 'servico') {
    this.resetarFormulario();
    this.tipoModal = tipo;
    this.modoEdicao = false;
    this.servicoEmEdicao = null;
    this.funcionarioEmEdicao = null;
    this.tagEmEdicao = null;
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
    this.tagEmEdicao = null;
    this.novaTag = { nome: '', categoria: 'EXTERNO' };
  }

  copiarLink() {
    navigator.clipboard.writeText(this.linkAgendamento);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.onFileSelected({ target: { files: files } });
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    // Validação de tipo de arquivo
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(file.type)) {
      this.erroUnidade = 'Formato inválido. Use apenas JPG, PNG ou WEBP.';
      return;
    }

    // Validação de tamanho (máx. 2MB)
    const maxSizeBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.erroUnidade = 'A imagem é muito grande. O tamanho máximo permitido é 2MB.';
      return;
    }

    this.erroUnidade = '';
    this.logoParaUpload = file;
    this.logoRemovida = false;
    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview = reader.result as string;
      this.cdRef.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  removerLogo() {
    this.logoParaUpload = null;
    this.logoPreview = null;
    this.unidade.logo_url = '';
    this.logoRemovida = true;
    this.cdRef.detectChanges();
  }

  /**
   * Salva dados da unidade (RF-13 + RF-21)
   * Usa FormData para suportar upload de logo junto com os dados cadastrais.
   */
  salvarUnidade() {
    this.erroUnidade = '';
    this.sucessoUnidade = '';

    if (!this.unidade.nome_fantasia?.trim()) {
      this.erroUnidade = 'O nome fantasia é obrigatório.';
      return;
    }

    const cnpjLimpo = this.unidade.cnpj.replace(/\D/g, '');
    if (!cnpjLimpo || cnpjLimpo.length !== 14) {
      this.erroUnidade = 'CNPJ inválido. Verifique se o número contém exatamente 14 dígitos.';
      return;
    }

    this.salvandoUnidade = true;

    const formData = new FormData();
    formData.append('nome_fantasia', this.unidade.nome_fantasia.trim());
    formData.append('cnpj', cnpjLimpo);
    formData.append('endereco_completo', this.unidade.endereco_completo?.trim() ?? '');
    
    if (this.logoParaUpload) {
      formData.append('logo', this.logoParaUpload);
    } else if (this.logoRemovida) {
      // Enviar string vazia sinaliza ao Django para remover o arquivo
      formData.append('logo', '');
    }

    this.estabelecimentoService.atualizarDadosEstabelecimento(formData)
      .pipe(
        finalize(() => {
          this.salvandoUnidade = false;
          this.cdRef.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.unidade = { ...res, cnpj: this.aplicarMascaraCNPJ(res.cnpj) };
          this.logoRemovida = false;
          // Preview persiste com a URL real devolvida pela API
          if (res.logo_url) {
            this.logoPreview = res.logo_url;
          }
          this.logoParaUpload = null; // Limpa o arquivo pendente
          this.atualizarLinkAgendamento();
          // Dispara atualização reativa da sidebar (logo, nome)
          this.authService.recarregarPerfil();
          this.sucessoUnidade = 'Dados da unidade salvos com sucesso! ✓';
          setTimeout(() => { this.sucessoUnidade = ''; this.cdRef.detectChanges(); }, 4000);
        },
        error: (err) => {
          // Usa mensagem do backend se disponível, senão exibe mensagem genérica amigável
          this.erroUnidade = err?.error?.error
            || 'Não foi possível salvar. Verifique sua conexão e tente novamente.';
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

  // Lógica de Tags de Peças
  carregarTags() {
    this.tagPecaService.listarTags().subscribe({
      next: (dados) => {
        this.tags = dados;
        this.cdRef.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar tags:', err)
    });
  }

  editarTag(tag: TagPeca) {
    this.tipoModal = 'tag';
    this.tagEmEdicao = tag;
    this.modoEdicao = true;
    this.novaTag = { ...tag };
    this.exibirModal = true;
  }

  salvarTag() {
    if (!this.novaTag.nome.trim()) {
      this.erroValidacao = 'O nome da peça é obrigatório.';
      return;
    }

    if (this.modoEdicao && this.tagEmEdicao?.id) {
      this.tagPecaService.atualizarTag(this.tagEmEdicao.id, this.novaTag).subscribe({
        next: () => {
          this.fecharModal();
          this.carregarTags();
        },
        error: () => this.erroValidacao = 'Erro ao atualizar tag.'
      });
    } else {
      this.tagPecaService.criarTag(this.novaTag).subscribe({
        next: () => {
          this.fecharModal();
          this.carregarTags();
        },
        error: () => this.erroValidacao = 'Erro ao criar tag.'
      });
    }
  }

  excluirTag(id: number | undefined) {
    if (!id) return;
    if (confirm('Deseja excluir esta peça do catálogo de vistorias?')) {
      this.tagPecaService.deletarTag(id).subscribe({
        next: () => this.carregarTags(),
        error: (err) => console.error('Erro ao excluir tag', err)
      });
    }
  }

  salvarGeral() {
    if (this.tipoModal === 'servico') {
      this.salvarServico();
    } else if (this.tipoModal === 'funcionario') {
      this.salvarFuncionario();
    } else if (this.tipoModal === 'tag') {
      this.salvarTag();
    }
  }
}
