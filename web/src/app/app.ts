import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  title = 'Gestor';
  exibirSidebar: boolean = true;
  perfil: any = null;

  constructor(private router: Router, private location: Location, private authService: AuthService) {
    // Monitora as mudanças de rota futuras para esconder a sidebar no login
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.atualizarEstadoSidebar(event.url);
      
      // Se estamos entrando em uma área protegida e não temos perfil, tenta carregar
      if (this.exibirSidebar && !this.perfil) {
        this.carregarPerfil();
      }
    });
  }

  ngOnInit() {
    // CORREÇÃO: Verifica o estado da URL imediatamente no carregamento inicial.
    // Isso evita que a sidebar apareça brevemente ao carregar o localhost:4200 diretamente no login.
    const urlInicial = this.location.path();
    this.atualizarEstadoSidebar(urlInicial);

    if (this.exibirSidebar) {
      this.carregarPerfil();
    }
  }

  carregarPerfil() {
    this.authService.obterPerfil().subscribe({
      next: (p) => this.perfil = p,
      error: () => console.warn('Usuário não autenticado ou sessão expirada.')
    });
  }

  /**
   * Lógica centralizada para decidir a visibilidade da sidebar.
   * Baseada na lógica de logout para garantir que a tela de login esteja sempre limpa.
   */
  private atualizarEstadoSidebar(url: string) {
    // Se a URL contiver '/login' ou estiver vazia (redirecionamento inicial), oculta a sidebar
    this.exibirSidebar = !(url.includes('/login') || url === '');
  }

  /**
   * Atalho global para o sino de notificações.
   * Redireciona o usuário diretamente para a aba de incidentes.
   */
  irParaIncidentes() {
    this.router.navigate(['/gestao/incidentes']);
  }

  /**
   * Realiza o logout do sistema e redireciona para a tela de login sem a barra lateral.
   */
  logout() {
    // Aqui garantimos o redirecionamento limpo para o login
    this.router.navigate(['/login']);
  }
}
