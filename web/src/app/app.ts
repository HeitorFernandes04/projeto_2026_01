import { CommonModule, Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AuthService } from './services/auth.service';
import { IncidentesService } from './services/incidentes.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  title = 'Gestor';
  exibirSidebar = true;
  perfil: any = null;
  totalIncidentesPendentes = 0;

  private intervaloIncidentes?: ReturnType<typeof setInterval>;

  constructor(
    private router: Router,
    private location: Location,
    private authService: AuthService,
    private incidentesService: IncidentesService,
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.atualizarEstadoSidebar(event.url);

        if (this.exibirSidebar && !this.perfil) {
          this.carregarPerfil();
        }

        if (this.exibirSidebar) {
          this.carregarTotalIncidentesPendentes();
          this.iniciarAtualizacaoIncidentes();
        } else {
          this.pararAtualizacaoIncidentes();
          this.totalIncidentesPendentes = 0;
        }
      });
  }

  ngOnInit() {
    const urlInicial = this.location.path();
    this.atualizarEstadoSidebar(urlInicial);

    if (this.exibirSidebar) {
      this.carregarPerfil();
      this.carregarTotalIncidentesPendentes();
      this.iniciarAtualizacaoIncidentes();
    } else {
      this.pararAtualizacaoIncidentes();
    }
  }

  ngOnDestroy() {
    this.pararAtualizacaoIncidentes();
  }

  carregarPerfil() {
    this.authService.obterPerfil().subscribe({
      next: (perfil) => {
        this.perfil = perfil;
      },
      error: () => console.warn('Usuario nao autenticado ou sessao expirada.'),
    });
  }

  carregarTotalIncidentesPendentes() {
    this.incidentesService.listarPendentes().subscribe({
      next: (incidentes) => {
        this.totalIncidentesPendentes = incidentes.length;
      },
      error: () => {
        this.totalIncidentesPendentes = 0;
      },
    });
  }

  private atualizarEstadoSidebar(url: string) {
    this.exibirSidebar = !(url.includes('/login') || url === '');
  }

  irParaIncidentes() {
    this.router.navigate(['/gestao/incidentes']);
  }

  logout() {
    this.router.navigate(['/login']);
  }

  private iniciarAtualizacaoIncidentes() {
    if (this.intervaloIncidentes) {
      return;
    }

    this.intervaloIncidentes = setInterval(() => {
      if (this.exibirSidebar) {
        this.carregarTotalIncidentesPendentes();
      }
    }, 30000);
  }

  private pararAtualizacaoIncidentes() {
    if (this.intervaloIncidentes) {
      clearInterval(this.intervaloIncidentes);
      this.intervaloIncidentes = undefined;
    }
  }
}
