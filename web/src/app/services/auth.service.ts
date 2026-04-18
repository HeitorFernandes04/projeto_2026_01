import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // CORREÇÃO: Certifique-se de que o prefixo /api/ está presente
  // Se você não configurou um proxy no Angular, use a URL completa:
  // private readonly apiUrl = 'http://localhost:8000/api/accounts/login/';
  private readonly apiUrl = '/api/auth/login/';

  constructor(private http: HttpClient) {}

  login(credentials: any) {
    return this.http.post<any>(this.apiUrl, credentials).pipe(
      tap(res => {
        if (res.access) {
          localStorage.setItem('access_token', res.access);
        }
      })
    );
  }
}
