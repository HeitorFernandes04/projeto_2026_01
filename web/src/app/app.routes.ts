import { Routes } from '@angular/router';
import { authGuard } from './auth/login/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'gestao',
    canActivate: [authGuard], // PROTEÇÃO ATIVADA AQUI
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./gestao/dashboard/dashboard-apiview').then(m => m.DashboardAPIView)
      },
      {
        path: 'kanban',
        loadComponent: () =>
          import('./gestao/kanban/kanban.component').then(m => m.KanbanComponent)
      },
      {
        path: 'incidentes',
        loadComponent: () =>
          import('./gestao/incidentes/incidentes.component').then(m => m.IncidentesComponent)
      },
      {
        path: 'historico',
        loadComponent: () =>
          import('./gestao/historico/historico.component').then(m => m.HistoricoComponent)
      },
      {
        path: 'dossie/:id',
        loadComponent: () =>
          import('./gestao/dossie/dossie.component').then(m => m.DossieComponent)
      },
      {
        path: 'setup',
        loadComponent: () =>
          import('./gestao/setup/setup.component').then(m => m.SetupComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  // RF-21: Rota pública do Portal de Autoagendamento — SEM canActivate (sem autenticação)
  {
    path: 'agendar/:slug',
    loadComponent: () =>
      import('./public/autoagendamento/autoagendamento.component').then(
        m => m.AutoagendamentoComponent
      )
  }
];
