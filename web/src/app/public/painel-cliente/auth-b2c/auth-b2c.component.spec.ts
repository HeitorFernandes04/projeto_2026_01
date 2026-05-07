import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthB2CService } from '../../../services/auth-b2c.service';
import { AuthB2CComponent } from './auth-b2c.component';

async function criarComponente(routerUrl = '/agendar/lava-me-centro/cliente') {
  const routeMock = {
    snapshot: {
      paramMap: { get: vi.fn().mockReturnValue('lava-me-centro') },
      queryParamMap: { get: vi.fn().mockReturnValue(null) },
    },
    parent: null,
  } as any;

  const routerMock = {
    url: routerUrl,
    navigate: vi.fn(),
  } as any;

  const authB2CServiceMock = {
    login: vi.fn().mockReturnValue(of({ access: 'access', refresh: 'refresh' })),
    setup: vi.fn().mockReturnValue(of({ access: 'access', refresh: 'refresh' })),
  } as any;

  await TestBed.configureTestingModule({
    imports: [AuthB2CComponent],
    providers: [
      { provide: ActivatedRoute, useValue: routeMock },
      { provide: Router, useValue: routerMock },
      { provide: AuthB2CService, useValue: authB2CServiceMock },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AuthB2CComponent);
  const component = fixture.componentInstance;
  const cdrMock = vi.spyOn((component as any).cdr, 'detectChanges');
  fixture.detectChanges();

  return { fixture, component, routerMock, authB2CServiceMock, cdrMock };
}

describe('AuthB2CComponent - UX de entrada do cliente', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('deve iniciar em modo login quando a rota nao pedir setup explicitamente', async () => {
    const { component } = await criarComponente();

    expect(component.modo).toBe('login');
    expect(component.titulo).toBe('Acesso do cliente');
    expect(component.textoBotaoPrincipal).toBe('Acessar painel');
  });

  it('deve oferecer Novo Acesso como caminho secundario para cadastro', async () => {
    const { component, routerMock } = await criarComponente();

    expect(component.textoAlternarModo).toBe('Novo Acesso');

    component.alternarModo();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/agendar/lava-me-centro/cliente/setup'], {
      queryParams: {
        telefone: null,
        placa: null,
      },
    });
  });

  it('deve mostrar feedback claro quando telefone ou PIN forem invalidos', async () => {
    const { component, authB2CServiceMock, cdrMock } = await criarComponente();
    authB2CServiceMock.login.mockReturnValue(
      throwError(() => ({ status: 401, error: { detail: 'No active account found with the given credentials' } })),
    );

    component.telefone = '(11) 99999-0000';
    component.pin = '0000';
    component.enviar();
    await Promise.resolve();

    expect(component.erro).toContain('Telefone ou PIN incorretos');
    expect(component.carregando).toBe(false);
    expect(cdrMock).toHaveBeenCalled();
  });

  it('deve orientar usuario existente a entrar quando setup retornar conflito', async () => {
    const { component, authB2CServiceMock, cdrMock } = await criarComponente('/agendar/lava-me-centro/cliente/setup');
    authB2CServiceMock.setup.mockReturnValue(
      throwError(() => ({ status: 409, error: { detail: 'usuario B2C ja possui PIN cadastrado' } })),
    );

    component.telefone = '(11) 99999-0000';
    component.placa = 'ABC-1234';
    component.pin = '1234';
    component.confirmarPin = '1234';
    component.enviar();
    await Promise.resolve();

    expect(component.erro).toContain('Este telefone ja tem acesso cadastrado');
    expect(cdrMock).toHaveBeenCalled();
  });

  it('deve orientar cliente sem veiculo a iniciar um agendamento antes de criar acesso', async () => {
    const { component, authB2CServiceMock, cdrMock } = await criarComponente('/agendar/lava-me-centro/cliente/setup');
    authB2CServiceMock.setup.mockReturnValue(
      throwError(() => ({ status: 404, error: { detail: 'Combinacao de placa e telefone nao encontrada.' } })),
    );

    component.telefone = '(11) 99999-0000';
    component.placa = 'ABC-1234';
    component.pin = '1234';
    component.confirmarPin = '1234';
    component.enviar();
    await Promise.resolve();

    expect(component.erro).toBe('Inicie pelo menos um agendamento antes de criar seu acesso.');
    expect(cdrMock).toHaveBeenCalled();
  });

  it('deve diferenciar textos de carregamento para login e novo acesso', async () => {
    const login = (await criarComponente()).component;
    login.carregando = true;

    TestBed.resetTestingModule();
    const setup = (await criarComponente('/agendar/lava-me-centro/cliente/setup')).component;
    setup.carregando = true;

    expect(login.textoBotaoPrincipal).toBe('Entrando...');
    expect(setup.textoBotaoPrincipal).toBe('Criando acesso...');
  });
});

describe('AuthB2CComponent - Contrato de layout alinhado ao gestor', () => {
  async function renderizar(routerUrl = '/agendar/lava-me-centro/cliente') {
    const routeMock = {
      snapshot: {
        paramMap: { get: vi.fn().mockReturnValue('lava-me-centro') },
        queryParamMap: { get: vi.fn().mockReturnValue(null) },
      },
      parent: null,
    } as any;

    const routerMock = {
      url: routerUrl,
      navigate: vi.fn(),
    } as any;

    const authB2CServiceMock = {
      login: vi.fn().mockReturnValue(of({ access: 'access', refresh: 'refresh' })),
      setup: vi.fn().mockReturnValue(of({ access: 'access', refresh: 'refresh' })),
    } as any;

    await TestBed.configureTestingModule({
      imports: [AuthB2CComponent],
      providers: [
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: Router, useValue: routerMock },
        { provide: AuthB2CService, useValue: authB2CServiceMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AuthB2CComponent);
    fixture.detectChanges();
    return { fixture, routerMock };
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('deve renderizar cliente com a mesma estrutura visual do login gestor', async () => {
    const { fixture } = await renderizar();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.login-wrapper')).not.toBeNull();
    expect(element.querySelector('.login-card')).not.toBeNull();
    expect(element.querySelector('.login-header')).not.toBeNull();
    expect(element.querySelector('form.login-form')).not.toBeNull();
    expect(element.querySelector('.form-footer')).not.toBeNull();
  });

  it('deve manter somente as entradas de dados do cliente no layout padrao', async () => {
    const { fixture } = await renderizar('/agendar/lava-me-centro/cliente/setup');
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('input[name="telefone"]')).not.toBeNull();
    expect(element.querySelector('input[name="placa"]')).not.toBeNull();
    expect(element.querySelector('input[name="pin"]')).not.toBeNull();
    expect(element.querySelector('input[name="confirmarPin"]')).not.toBeNull();
    expect(element.querySelector('input[name="email"]')).toBeNull();
    expect(element.querySelector('input[name="password"]')).toBeNull();
  });

  it('deve expor o alternador de modo como botao acessivel no rodape', async () => {
    const { fixture, routerMock } = await renderizar();
    const element = fixture.nativeElement as HTMLElement;
    const alternador = element.querySelector('.form-footer button') as HTMLButtonElement;

    expect(alternador).not.toBeNull();
    expect(alternador.getAttribute('type')).toBe('button');
    expect(alternador.textContent?.trim()).toBe('Novo Acesso');

    alternador.click();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/agendar/lava-me-centro/cliente/setup'], {
      queryParams: {
        telefone: null,
        placa: null,
      },
    });
  });
});
