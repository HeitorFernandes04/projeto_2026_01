import { Routes } from '@angular/router';

export const testRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'gestao',
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
        path: 'dossie',
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
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
