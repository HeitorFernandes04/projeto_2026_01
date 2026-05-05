import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';

export const clienteAuthGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = localStorage.getItem('access_token');
  const slug = route.parent?.parent?.paramMap.get('slug') ?? route.paramMap.get('slug') ?? '';

  if (!token) {
    router.navigate([`/agendar/${slug}/cliente/login`]);
    return false;
  }

  return authService.obterPerfil().pipe(
    map(perfil => {
      if (perfil?.tipo_perfil === 'CLIENTE') {
        return true;
      }
      router.navigate([`/agendar/${slug}/cliente/login`]);
      return false;
    }),
    catchError(() => {
      router.navigate([`/agendar/${slug}/cliente/login`]);
      return of(false);
    })
  );
};
