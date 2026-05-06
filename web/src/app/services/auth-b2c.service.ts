import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AuthB2CTokens {
  access: string;
  refresh: string;
}

export interface AuthB2CSetupPayload {
  telefone: string;
  placa: string;
  pin: string;
}

export interface AuthB2CLoginPayload {
  telefone: string;
  pin: string;
}

@Injectable({ providedIn: 'root' })
export class AuthB2CService {
  private readonly setupUrl = '/api/publico/auth/setup/';
  private readonly loginUrl = '/api/publico/auth/login/';

  constructor(private readonly http: HttpClient) {}

  setup(payload: AuthB2CSetupPayload): Observable<AuthB2CTokens> {
    return this.http.post<AuthB2CTokens>(this.setupUrl, payload).pipe(
      tap(tokens => this.salvarTokens(tokens))
    );
  }

  login(payload: AuthB2CLoginPayload): Observable<AuthB2CTokens> {
    return this.http.post<AuthB2CTokens>(this.loginUrl, payload).pipe(
      tap(tokens => this.salvarTokens(tokens))
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  private salvarTokens(tokens: AuthB2CTokens): void {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  }
}
