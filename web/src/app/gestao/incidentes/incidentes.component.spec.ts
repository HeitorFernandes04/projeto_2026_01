import '@angular/compiler';

import { of, throwError } from 'rxjs';
import { IncidentesComponent } from './incidentes.component';

const incidenteMock = {
  id: 7,
  ordem_servico: {
    id: 15,
    veiculo: {
      placa: 'BRA-2E19',
      modelo: 'Audi A3',
      marca: 'Audi',
      cor: 'Preto',
    },
    servico: {
      nome: 'Lavagem Completa',
      duracao_estimada_minutos: 90,
    },
    status: 'BLOQUEADO_INCIDENTE',
    status_display: 'Bloqueado por Incidente',
    data_hora: '2026-04-20T13:00:00Z',
  },
  tag_peca: {
    id: 4,
    nome: 'Para-choque',
    categoria: 'EXTERNO',
  },
  descricao: 'Risco profundo detectado.',
  foto_url: '/media/incidentes/foto.jpg',
  status_anterior_os: 'EM_EXECUCAO',
  resolvido: false,
  data_registro: '2026-04-20T14:00:00Z',
  data_resolucao: null,
  observacoes_resolucao: null,
};

describe('IncidentesComponent - Central de Incidentes', () => {
  let component: IncidentesComponent;
  let service: any;

  beforeEach(() => {
    service = {
      listarPendentes: vi.fn(() => of([incidenteMock])),
      obterAuditoria: vi.fn(() => of(incidenteMock)),
      resolver: vi.fn(() => of({ ...incidenteMock, resolvido: true })),
    };

    component = new IncidentesComponent(service);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('RF-15 - Central de incidentes pendentes', () => {
    it('deve carregar incidentes pendentes pela API e ativar alerta visual', () => {
      component.ngOnInit();

      expect(service.listarPendentes).toHaveBeenCalled();
      expect(component.carregando).toBe(false);
      expect(component.incidentes.length).toBe(1);
      expect(component.temPendencias).toBe(true);
      expect(component.incidentes[0].ordem_servico.status).toBe('BLOQUEADO_INCIDENTE');
    });

    it('deve expor mensagem amigavel quando a API falhar', () => {
      service.listarPendentes.mockReturnValue(throwError(() => new Error('falha')));

      component.carregarPendentes();

      expect(component.carregando).toBe(false);
      expect(component.erro).toBe('Não foi possível carregar os incidentes pendentes.');
    });
  });

  describe('RF-16 - Auditoria e desbloqueio', () => {
    it('deve ter estado inicial do modal fechado', () => {
      expect(component.modalAberto).toBe(false);
      expect(component.incidenteSelecionado).toBeNull();
    });

    it('deve abrir auditoria buscando dados consolidados pela API', () => {
      component.abrirModal(incidenteMock);

      expect(component.modalAberto).toBe(true);
      expect(component.auditoriaCarregando).toBe(false);
      expect(service.obterAuditoria).toHaveBeenCalledWith(7);
      expect(component.incidenteSelecionado?.tag_peca.nome).toBe('Para-choque');
    });

    it('deve fechar modal e limpar dados selecionados', () => {
      component.abrirModal(incidenteMock);
      expect(component.modalAberto).toBe(true);

      component.fecharModal();

      expect(component.modalAberto).toBe(false);
      expect(component.incidenteSelecionado).toBeNull();
      expect(component.notaResolucao).toBe('');
    });

    it('deve bloquear resolucao sem nota', () => {
      component.incidenteSelecionado = incidenteMock;
      component.notaResolucao = '   ';

      component.resolverIncidente();

      expect(component.erroResolucao).toBe('A nota de resolução é obrigatória.');
      expect(service.resolver).not.toHaveBeenCalled();
    });

    it('deve resolver incidente com nota e recarregar a central', () => {
      component.incidenteSelecionado = incidenteMock;
      component.modalAberto = true;
      component.notaResolucao = 'Auditoria aprovada.';

      component.resolverIncidente();

      expect(service.resolver).toHaveBeenCalledWith(7, 'Auditoria aprovada.');
      expect(service.listarPendentes).toHaveBeenCalled();
      expect(component.modalAberto).toBe(false);
      expect(component.salvandoResolucao).toBe(false);
    });
  });
});
