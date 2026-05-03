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
    canActivate: [authGuard], // PROTEÇÃO PARA GESTORES E FUNCIONÁRIOS
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

  // RF-21, RF-24 e RF-25: Fluxo Unificado do Cliente Contextualizado por Unidade
  {
    path: 'agendar/:slug',
    children: [
      {
        path: '', // Rota pública de agendamento (RF-21)
        loadComponent: () =>
          import('./public/autoagendamento/autoagendamento.component').then(
            m => m.AutoagendamentoComponent
          )
      },
      {
        path: 'painel', // Painel Unificado do Cliente (RF-24/25/26)
        children: [
          {
            path: '',
            canActivate: [authGuard], // Axioma 14: Autenticação Unificada
            loadComponent: () =>
              import('./public/painel-cliente/painel.component').then(
                m => m.PainelComponent
              )
          },
          {
            path: 'galeria-transparencia', // Galeria de Transparência (herda proteção do painel)
            loadComponent: () =>
              import('./public/painel-cliente/componentes/galeria-transparencia/galeria-transparencia.component').then(
                m => m.GaleriaTransparenciaComponent
              )
          }
        ]
      }
    ]
  },

  // Rota de fallback para erros de digitação
  { path: '**', redirectTo: 'login' }
];
