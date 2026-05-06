import { HttpInterceptorFn } from '@angular/common/http';

const ROTAS_PUBLICAS = ['/api/publico/', '/api/auth/'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');
  const isRotaPublica = ROTAS_PUBLICAS.some(rota => req.url.includes(rota));

  if (!token || isRotaPublica) return next(req);

  return next(req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  }));
};
