import { HttpInterceptorFn } from '@angular/common/http';

const ROTAS_PUBLICAS = ['/api/publico/', '/api/auth/', '/api/cliente/auth/'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isRotaPublica = ROTAS_PUBLICAS.some(rota => req.url.includes(rota));
  const tokenKey = req.url.includes('/api/cliente/') ? 'b2c_access_token' : 'access_token';
  const token = localStorage.getItem(tokenKey);

  if (!token || isRotaPublica) return next(req);

  return next(req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  }));
};
