import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * Proteção de rota rigorosa para a área de gestão.
 * Garante que apenas usuários com perfil GESTOR acessem as rotas de gestão.
 * Caso contrário, destrói a sessão e redireciona para o login.
 */
export const gestorGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = localStorage.getItem('access_token');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  return authService.obterPerfil().pipe(
    map(perfil => {
      if (perfil && perfil.tipo_perfil === 'GESTOR') {
        return true;
      } else {
        localStorage.removeItem('access_token');
        router.navigate(['/login'], { queryParams: { erro: 'Esta área é restrita para gestores.' } });
        return false;
      }
    }),
    catchError(() => {
      localStorage.removeItem('access_token');
      router.navigate(['/login']);
      return of(false);
    })
  );
};
