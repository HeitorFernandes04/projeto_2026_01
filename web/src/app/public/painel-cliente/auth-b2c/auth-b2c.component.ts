import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthB2CService } from '../../../services/auth-b2c.service';

@Component({
  selector: 'app-auth-b2c',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-b2c.component.html',
  styleUrl: './auth-b2c.component.scss',
})
export class AuthB2CComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authB2CService = inject(AuthB2CService);
  private readonly cdr = inject(ChangeDetectorRef);

  modo: 'login' | 'setup' = 'login';
  telefone = '';
  placa = '';
  pin = '';
  confirmarPin = '';
  carregando = false;
  erro = '';

  ngOnInit(): void {
    this.modo = this.router.url.includes('/setup') ? 'setup' : 'login';
    this.placa = this.route.snapshot.queryParamMap.get('placa') ?? '';
    this.telefone = this.route.snapshot.queryParamMap.get('telefone') ?? '';
  }

  enviar(): void {
    if (!this.formularioValido || this.carregando) return;

    this.erro = '';
    this.carregando = true;
    const acao = this.modo === 'setup'
      ? this.authB2CService.setup({
          telefone: this.somenteDigitos(this.telefone),
          placa: this.placa,
          pin: this.pin,
        })
      : this.authB2CService.login({
          telefone: this.somenteDigitos(this.telefone),
          pin: this.pin,
        });

    acao.pipe(finalize(() => this.carregando = false)).subscribe({
      next: () => {
        this.router.navigate([`/agendar/${this.slugAtual}/painel`]);
      },
      error: (err) => {
        this.erro = this.mensagemErro(err);
        queueMicrotask(() => this.cdr.detectChanges());
      },
    });
  }

  alternarModo(): void {
    const slug = this.slugAtual;
    const destino = this.modo === 'login' ? 'setup' : 'login';
    this.router.navigate([`/agendar/${slug}/cliente/${destino}`], {
      queryParams: {
        telefone: this.telefone || null,
        placa: this.placa || null,
      },
    });
  }

  onInputTelefone(event: Event): void {
    const input = event.target as HTMLInputElement;
    let valor = this.somenteDigitos(input.value).slice(0, 11);
    if (valor.length > 10) {
      valor = valor.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (valor.length > 6) {
      valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    } else if (valor.length > 2) {
      valor = valor.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
    }
    this.telefone = valor;
    input.value = valor;
  }

  onInputPlaca(event: Event): void {
    const input = event.target as HTMLInputElement;
    let valor = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
    if (valor.length > 3) valor = `${valor.slice(0, 3)}-${valor.slice(3)}`;
    this.placa = valor;
    input.value = valor;
  }

  get formularioValido(): boolean {
    const telefoneValido = this.somenteDigitos(this.telefone).length >= 10;
    const pinValido = /^\d{4}$/.test(this.pin);
    if (this.modo === 'login') return telefoneValido && pinValido;
    return telefoneValido && this.placa.replace(/[^A-Z0-9]/gi, '').length === 7 && pinValido && this.pin === this.confirmarPin;
  }

  get titulo(): string {
    return this.modo === 'login' ? 'Acesso do cliente' : 'Novo acesso';
  }

  get descricao(): string {
    return this.modo === 'login'
      ? 'Entre com telefone e PIN para acompanhar seus agendamentos.'
      : 'Confirme telefone, placa e escolha um PIN de 4 digitos.';
  }

  get textoBotaoPrincipal(): string {
    if (this.carregando) return this.modo === 'login' ? 'Entrando...' : 'Criando acesso...';
    return this.modo === 'login' ? 'Acessar painel' : 'Criar PIN';
  }

  get textoAlternarModo(): string {
    return this.modo === 'login' ? 'Novo Acesso' : 'Ja tenho PIN';
  }

  private somenteDigitos(valor: string): string {
    return (valor || '').replace(/\D/g, '');
  }

  private mensagemErro(err: any): string {
    if (err?.status === 401) {
      return 'Telefone ou PIN incorretos. Confira os dados e tente novamente.';
    }

    if (err?.status === 409) {
      return 'Este telefone ja tem acesso cadastrado. Entre usando seu PIN.';
    }

    if (err?.status === 400) {
      return err?.error?.detail || 'Confira telefone, placa e PIN antes de continuar.';
    }

    return 'Nao foi possivel concluir o acesso. Tente novamente em instantes.';
  }

  private get slugAtual(): string {
    return this.route.snapshot.paramMap.get('slug')
      ?? this.route.parent?.snapshot.paramMap.get('slug')
      ?? '';
  }
}
