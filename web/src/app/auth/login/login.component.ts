import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  // Propriedades vinculadas ao formulário via [(ngModel)]
  email = '';
  password = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  /**
   * Realiza a autenticação real no backend Django.
   * Substitui a simulação anterior para garantir o cumprimento do Axioma 14.
   */
  acessar() {
    const credentials = {
      email: this.email,
      password: this.password
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('Login realizado com sucesso. Token armazenado.');
        // Redireciona para o fluxo de gestão após obter o token
        this.router.navigate(['/gestao/dashboard']);
      },
      error: (err) => {
        console.error('Falha na autenticação:', err);
        alert('Credenciais inválidas ou erro de conexão com o servidor.');
      }
    });
  }
}