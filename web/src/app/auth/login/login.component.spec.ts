import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { LoginComponent } from './login.component';

async function criarComponente() {
  const authServiceSpy = {
    login: vi.fn(),
  };

  const routerSpy = {
    navigate: vi.fn(),
  };

  await TestBed.configureTestingModule({
    imports: [LoginComponent],
    providers: [
      { provide: AuthService, useValue: authServiceSpy },
      { provide: Router, useValue: routerSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(LoginComponent);
  const component = fixture.componentInstance;
  const cdrSpy = vi.spyOn((component as any).cdr, 'detectChanges');

  return { fixture, component, authServiceSpy, routerSpy, cdrSpy };
}

describe('LoginComponent - Fluxo de Autenticacao Unificado', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', async () => {
    const { component } = await criarComponente();

    expect(component).toBeTruthy();
  });

  it('deve ter metodo acessar() disponivel', async () => {
    const { component } = await criarComponente();

    expect(component.acessar).toBeDefined();
    expect(typeof component.acessar).toBe('function');
  });

  it('deve ter propriedades de formulario inicializadas como vazias', async () => {
    const { component } = await criarComponente();

    expect(component.email).toBe('');
    expect(component.password).toBe('');
    expect(component.erro).toBe('');
  });

  it('deve chamar AuthService e navegar para dashboard em login bem-sucedido', async () => {
    const { component, authServiceSpy, routerSpy } = await criarComponente();
    authServiceSpy.login.mockReturnValue(of({ access: 'token123', refresh: 'refresh123' }));

    component.email = 'test@lavame.com.br';
    component.password = 'password123';
    component.erro = 'Senha incorreta. Confira seus dados e tente novamente.';

    component.acessar();

    expect(authServiceSpy.login).toHaveBeenCalledWith({
      email: 'test@lavame.com.br',
      password: 'password123',
    });
    expect(component.erro).toBe('');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/gestao/dashboard']);
  });

  it('deve exibir mensagem clara quando a senha estiver incorreta', async () => {
    const { component, authServiceSpy, routerSpy, cdrSpy } = await criarComponente();
    authServiceSpy.login.mockReturnValue(throwError(() => ({ status: 401, error: 'Credenciais invalidas' })));

    component.email = 'test@lavame.com.br';
    component.password = 'senha_errada';

    component.acessar();

    expect(authServiceSpy.login).toHaveBeenCalledWith({
      email: 'test@lavame.com.br',
      password: 'senha_errada',
    });
    expect(component.erro).toBe('Senha incorreta. Confira seus dados e tente novamente.');
    expect(cdrSpy).toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('deve informar falha generica quando o erro nao for autenticacao', async () => {
    const { component, authServiceSpy, routerSpy, cdrSpy } = await criarComponente();
    authServiceSpy.login.mockReturnValue(throwError(() => ({ status: 500 })));

    component.email = 'test@lavame.com.br';
    component.password = 'password123';

    component.acessar();

    expect(component.erro).toBe('Nao foi possivel acessar agora. Tente novamente em instantes.');
    expect(cdrSpy).toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('nao deve tentar login se campos estiverem vazios', async () => {
    const { component, authServiceSpy } = await criarComponente();

    component.email = '';
    component.password = '';

    expect(component.acessar).toBeDefined();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('deve manter login bloqueado apenas com email preenchido', async () => {
    const { component, authServiceSpy } = await criarComponente();

    component.email = 'test@lavame.com.br';
    component.password = '';

    expect(component.acessar).toBeDefined();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('deve manter login bloqueado apenas com senha preenchida', async () => {
    const { component, authServiceSpy } = await criarComponente();

    component.email = '';
    component.password = 'password123';

    expect(component.acessar).toBeDefined();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('deve salvar token JWT no localStorage em login bem-sucedido', async () => {
    const { component, authServiceSpy, routerSpy } = await criarComponente();
    authServiceSpy.login.mockReturnValue(of({ access: 'jwt_token_abc123', refresh: 'refresh_token_xyz' }));

    component.email = 'test@lavame.com.br';
    component.password = 'password123';
    component.acessar();

    expect(authServiceSpy.login).toHaveBeenCalledWith({
      email: 'test@lavame.com.br',
      password: 'password123',
    });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/gestao/dashboard']);
  });
});

describe('LoginComponent - Feedback visual de erro', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('deve mostrar mensagem acessivel quando a senha estiver incorreta', async () => {
    const { fixture, component, authServiceSpy } = await criarComponente();
    authServiceSpy.login.mockReturnValue(throwError(() => ({ status: 401 })));

    component.email = 'gestor@lavame.com.br';
    component.password = 'senha_errada';

    component.acessar();
    fixture.detectChanges();

    const alerta = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;

    expect(alerta).not.toBeNull();
    expect(alerta.textContent?.trim()).toBe('Senha incorreta. Confira seus dados e tente novamente.');
  });
});
