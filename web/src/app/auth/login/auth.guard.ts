import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

/**
 * Proteção de rota para garantir que apenas usuários autenticados
 * acessem as áreas de gestão da Sprint 2.
 */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');

  if (token) {
    return true; // Token presente, acesso liberado
  } else {
    // Sem token, redireciona para o login
    router.navigate(['/login']);
    return false;
  }
};
