import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CardAtivoComponent } from './card-ativo.component';
import { OrdemServico, OrdemServicoService } from '../../services/ordem-servico.service';

const ativoPatio: OrdemServico = {
  id: 123,
  modelo: 'Honda Civic',
  placa: 'ABC-1D23',
  horario: '10:00',
  data: '05/05/2026',
  servico: 'Lavagem Completa',
  status: 'PATIO',
  previsao_entrega: '11:00',
  nome_dono: 'Carlos Silva',
  slug_cancelamento: 'f475af97-c771-4d7a-ba1d-1047db93d0e9',
};

function criarComponente(cancelarAgendamento = vi.fn().mockReturnValue(of({ detail: 'ok' }))) {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: OrdemServicoService,
        useValue: { cancelarAgendamento },
      },
    ],
  });

  const component = TestBed.runInInjectionContext(() => new CardAtivoComponent());
  component.ativo = ativoPatio;

  return { component, cancelarAgendamento };
}

describe('CardAtivoComponent - RF-24', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('permite cancelar apenas OS em PATIO com slug real', () => {
    const { component } = criarComponente();

    expect(component.podeCancelar).toBe(true);

    component.ativo = { ...ativoPatio, status: 'EM_EXECUCAO' };
    expect(component.podeCancelar).toBe(false);

    component.ativo = { ...ativoPatio, slug_cancelamento: undefined };
    expect(component.podeCancelar).toBe(false);
  });

  it('chama o service usando slug_cancelamento e emite evento apos sucesso', () => {
    const { component, cancelarAgendamento } = criarComponente();
    const emitSpy = vi.spyOn(component.cancelado, 'emit');

    component.cancelarAgendamento();

    expect(cancelarAgendamento).toHaveBeenCalledWith('f475af97-c771-4d7a-ba1d-1047db93d0e9');
    expect(emitSpy).toHaveBeenCalledWith(123);
    expect(component.cancelando).toBe(false);
    expect(component.erroCancelamento).toBe('');
  });

  it('mostra mensagem amigavel quando a API rejeita o cancelamento', () => {
    const cancelarAgendamento = vi.fn().mockReturnValue(
      throwError(() => ({ error: { detail: 'O cancelamento so e permitido com 1 hora de antecedencia.' } })),
    );
    const { component } = criarComponente(cancelarAgendamento);
    const emitSpy = vi.spyOn(component.cancelado, 'emit');

    component.cancelarAgendamento();

    expect(emitSpy).not.toHaveBeenCalled();
    expect(component.cancelando).toBe(false);
    expect(component.erroCancelamento).toBe('O cancelamento so e permitido com 1 hora de antecedencia.');
  });
});
