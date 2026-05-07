import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  email = '';
  password = '';
  erro = '';

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

  private mensagemErro(err: any): string {
    if (err?.status === 400 || err?.status === 401 || err?.status === 403) {
      return 'Senha incorreta. Confira seus dados e tente novamente.';
    }

    return 'Nao foi possivel acessar agora. Tente novamente em instantes.';
  }
}
