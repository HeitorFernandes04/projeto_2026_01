import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  token = '';
  password = '';
  confirmPassword = '';
  carregando = false;
  erro = '';
  sucesso = false;

  showPassword = false;
  showConfirmPassword = false;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
    });
  }

  get hasMinLength() { return this.password.length >= 8; }
  get hasUpperCase() { return /[A-Z]/.test(this.password); }
  get hasNumber() { return /\d/.test(this.password); }
  get hasSpecialChar() { return /[^A-Za-z0-9]/.test(this.password); }

  get isPasswordValid() {
    return this.hasMinLength && this.hasUpperCase && this.hasNumber && this.hasSpecialChar;
  }

  toggleShowPassword() { this.showPassword = !this.showPassword; }
  toggleShowConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }

  redefinirSenha(): void {
    if (!this.token) {
      this.erro = 'Token inválido ou ausente.';
      return;
    }
    if (!this.isPasswordValid) {
      this.erro = 'A senha não cumpre todos os critérios de segurança.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.erro = 'As senhas não coincidem.';
      return;
    }

    this.erro = '';
    this.carregando = true;

    this.authService.confirmarRecuperacaoSenha(this.token, this.password).subscribe({
      next: () => {
        this.sucesso = true;
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.erro = err.error?.detail || err.error?.[0] || 'Não foi possível redefinir a senha.';
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  irParaLogin(): void {
    this.router.navigate(['/login']);
  }
}
