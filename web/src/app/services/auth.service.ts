import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = '/api/auth/login/';

  /** Stream reativo do perfil — qualquer componente pode se inscrever */
  private perfilSubject = new BehaviorSubject<any>(null);
  perfil$ = this.perfilSubject.asObservable();

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

  obterPerfil(): Observable<any> {
    const token = localStorage.getItem('access_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.get<any>('/api/auth/meu_perfil/', { headers }).pipe(
      tap(perfil => this.perfilSubject.next(perfil))
    );
  }

  /** Força recarga do perfil (chamado após salvar logo, nome, etc.) */
  recarregarPerfil(): void {
    this.obterPerfil().subscribe();
  }
}
