import { CommonModule, Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
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

  private readonly subscriptions = new Subscription();
  private monitoramentoIncidentesAtivo = false;

  constructor(
    private router: Router,
    private location: Location,
    private authService: AuthService,
    private incidentesService: IncidentesService,
  ) {
    this.subscriptions.add(
      this.incidentesService.totalPendentes$.subscribe((total) => {
        this.totalIncidentesPendentes = total;
      }),
    );

    this.subscriptions.add(
      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe((event: any) => {
          this.atualizarEstadoSidebar(event.url);

          if (this.exibirSidebar && !this.perfil) {
            this.carregarPerfil();
          }

          if (this.exibirSidebar) {
            this.iniciarMonitoramentoIncidentes();
          } else {
            this.pararMonitoramentoIncidentes();
            this.totalIncidentesPendentes = 0;
          }
        }),
    );
  }

  ngOnInit() {
    const urlInicial = this.location.path();
    this.atualizarEstadoSidebar(urlInicial);

    if (this.exibirSidebar) {
      this.carregarPerfil();
      this.iniciarMonitoramentoIncidentes();
    } else {
      this.pararMonitoramentoIncidentes();
    }
  }

  ngOnDestroy() {
    this.pararMonitoramentoIncidentes();
    this.subscriptions.unsubscribe();
  }

  carregarPerfil() {
    this.authService.obterPerfil().subscribe({
      next: (perfil) => {
        this.perfil = perfil;
      },
      error: () => console.warn('Usuario nao autenticado ou sessao expirada.'),
    });
  }

  private atualizarEstadoSidebar(url: string) {
    this.exibirSidebar = !(
      url.includes('/login') ||
      url.includes('/agendar/') ||
      url === ''
    );
  }

  irParaIncidentes() {
    this.router.navigate(['/gestao/incidentes']);
  }

  logout() {
    this.router.navigate(['/login']);
  }

  private iniciarMonitoramentoIncidentes() {
    if (this.monitoramentoIncidentesAtivo) {
      return;
    }

    this.monitoramentoIncidentesAtivo = true;
    this.incidentesService.iniciarMonitoramentoPendentes();
  }

  private pararMonitoramentoIncidentes() {
    if (!this.monitoramentoIncidentesAtivo) {
      return;
    }

    this.monitoramentoIncidentesAtivo = false;
    this.incidentesService.pararMonitoramentoPendentes();
  }
}
