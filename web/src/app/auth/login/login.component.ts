import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  email = '';
  password = '';
  erro = '';

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['erro']) {
        this.erro = params['erro'];
        this.cdr.detectChanges();
      }
    });
  }

  acessar(): void {
    this.erro = '';
    const credentials = {
      email: this.email,
      password: this.password,
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        console.log('Login realizado com sucesso. Token armazenado.');
        this.router.navigate(['/gestao/dashboard']);
      },
      error: (err) => {
        console.error('Falha na autenticacao:', err);
        this.erro = this.mensagemErro(err);
        this.cdr.detectChanges();
      },
    });
  }

  private mensagemErro(err: { status?: number }): string {
    if (err?.status === 400 || err?.status === 401 || err?.status === 403) {
      return 'Senha incorreta. Confira seus dados e tente novamente.';
    }

    return 'Nao foi possivel acessar agora. Tente novamente em instantes.';
  }
}
