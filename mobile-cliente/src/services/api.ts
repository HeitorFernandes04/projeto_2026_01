import { http } from './http';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

// — Interfaces —

export interface EstabelecimentoMapa {
  id: number;
  nome_fantasia: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  logo: string | null;
  endereco_completo: string;
  horario_abertura?: string | null;
  horario_fechamento?: string | null;
  avaliacao?: number | null;
  descricao?: string | null;
}

export interface Servico {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  duracao_estimada_min: number;
  is_active: boolean;
}

export interface EstabelecimentoDetalhe extends EstabelecimentoMapa {
  servicos: Servico[];
}

export interface Veiculo {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  cor: string;
}

export interface OrdemServico {
  id: number;
  servico_nome: string;
  estabelecimento_nome: string;
  data_agendamento?: string;
  horario?: string;
  data_hora?: string;
  valor: number;
  status: string;
  veiculo_placa: string;
  veiculo_modelo: string;
  veiculo_cor?: string;
  observacoes?: string;
  vaga_patio?: string;
}

export interface OrdemAtiva {
  id: number;
  servico_nome: string;
  estabelecimento_nome: string;
  veiculo_placa: string;
  veiculo_modelo: string;
  status: string;
  progresso: number;
  tempo_estimado_min: number | null;
  slug_cancelamento?: string | null;
  data_hora?: string;
  avaliacao_estrelas?: number | null;
}


export interface AcompanhamentoData {
  etapa_atual: number;
  status: string;
  slug_cancelamento?: string | null;
}

export interface ClientePerfil {
  id: number;
  nome: string;
  telefone: string;
  membro_desde: string;
  notificacoes_ativas?: boolean;
}

export interface PainelOrdemInfo {
  id: number;
  veiculo_placa: string;
  veiculo_modelo: string;
  servico_nome: string;
  estabelecimento: {
    nome_fantasia: string;
    slug: string;
  };
  status: string;
  status_display: string;
  data_hora: string;
  etapa_atual: number;
  slug_cancelamento?: string | null;
  avaliacao_estrelas?: number | null;
}

export interface PainelClienteResponse {
  cliente_nome: string;
  ativos: PainelOrdemInfo[];
  historico: PainelOrdemInfo[];
}


export interface Disponibilidade {
  horario: string;
  disponivel: boolean;
}

export interface AgendamentoPayload {
  slug: string;
  servico_id: number;
  veiculo_id: number;
  data_hora: string; // Esperado pelo ClienteAgendamentoSerializer do Django
}

// — Public (sem auth) —

export async function getEstabelecimentos(nota_minima?: number): Promise<EstabelecimentoMapa[]> {
  const params = nota_minima ? `?nota_minima=${nota_minima}` : '';
  const res = await fetch(`${BASE_URL}/api/publico/estabelecimentos/${params}`, {
    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
  });
  if (!res.ok) throw new Error('Falha ao carregar estabelecimentos.');
  return res.json();
}

export async function getEstabelecimento(slug: string): Promise<EstabelecimentoDetalhe> {
  const res = await fetch(`${BASE_URL}/api/publico/estabelecimento/${slug}/`);
  if (!res.ok) throw new Error('Falha ao carregar estabelecimento.');
  return res.json();
}

export async function getDisponibilidade(
  slug: string,
  servicoId: number,
  data: string,
): Promise<Disponibilidade[]> {
  const params = new URLSearchParams({ slug, servicoId: String(servicoId), data });
  const res = await fetch(`${BASE_URL}/api/publico/agendamento/disponibilidade/?${params}`);
  if (!res.ok) throw new Error('Falha ao carregar disponibilidade.');
  const dataJson = await res.json();
  return dataJson.map((item: any) => ({
    horario: item.inicio,
    disponivel: true,
  }));
}

export const solicitarOTP = (telefone: string, nome?: string) =>
  http.post<{ detail: string; pin_debug?: string }>('/api/publico/auth/whatsapp/', { telefone, nome });

export const verificarOTP = (telefone: string, codigo: string, token?: string | null) =>
  http.post<{ access: string; refresh: string; usuario: ClientePerfil }>('/api/publico/auth/verificacao/', { telefone, pin: codigo }, token ? { 'Authorization': `Bearer ${token}` } : undefined);


// — Authenticated —

export const getPerfil = () =>
  http.get<ClientePerfil>('/api/cliente/perfil/');

export const updatePerfil = (data: Partial<ClientePerfil>) =>
  http.patch<ClientePerfil>('/api/cliente/perfil/', data);

export const getVeiculos = () =>
  http.get<Veiculo[]>('/api/cliente/veiculos/');

export const getVeiculo = (id: number) =>
  http.get<Veiculo>(`/api/cliente/veiculos/${id}/`);

export const createVeiculo = (data: Omit<Veiculo, 'id'> & { estabelecimento_slug?: string }) =>
  http.post<Veiculo>('/api/cliente/veiculos/', data);

export const updateVeiculo = (id: number, data: Partial<Omit<Veiculo, 'id'>>) =>
  http.patch<Veiculo>(`/api/cliente/veiculos/${id}/`, data);

export const getOrdens = () =>
  http.get<OrdemServico[]>('/api/cliente/ordens/');

export const getOrdemAtiva = async (): Promise<OrdemAtiva | null> => {
  const painel = await getPainelCliente();
  const ativos = painel.ativos ?? [];
  const todayStr = new Date().toISOString().split('T')[0];

  if (ativos.length === 0) return null;

  // 1. Prioridade para ordens que já estão em execução
  const emExecucao = ativos.filter(a => 
    ['VISTORIA_INICIAL', 'EM_EXECUCAO', 'LIBERACAO', 'BLOQUEADO_INCIDENTE'].includes(a.status)
  );

  let ativo: any = null;

  if (emExecucao.length > 0) {
    // Pega a mais antiga (primeira agendada)
    ativo = emExecucao.sort((a, b) => a.data_hora.localeCompare(b.data_hora))[0];
  } else {
    // 2. Se nenhuma está em execução, procura as que estão no PÁTIO hoje
    const noPatioHoje = ativos.filter(a => {
      if (a.status !== 'PATIO') return false;
      const dateStr = a.data_hora.split('T')[0];
      return dateStr === todayStr;
    });

    if (noPatioHoje.length > 0) {
      // Pega a com horário mais próximo/antigo (a primeira do dia)
      ativo = noPatioHoje.sort((a, b) => a.data_hora.localeCompare(b.data_hora))[0];
    }
  }

  if (!ativo) return null;

  return {
    id: ativo.id,
    servico_nome: ativo.servico_nome,
    estabelecimento_nome: ativo.estabelecimento.nome_fantasia,
    veiculo_placa: ativo.veiculo_placa,
    veiculo_modelo: ativo.veiculo_modelo,
    status: ativo.status,
    progresso: ativo.etapa_atual,
    tempo_estimado_min: ativo.tempo_estimado_min,
    slug_cancelamento: ativo.slug_cancelamento,
    data_hora: ativo.data_hora,
    avaliacao_estrelas: ativo.avaliacao_estrelas,
  };
};

export const getAcompanhamento = async (osId: number) => {
  const res = await getPainelCliente();
  const ativos = res.ativos;
  const historico = res.historico ?? [];
  
  const ativa = ativos.find(a => a.id === osId) || historico.find(a => a.id === osId);
  
  if (!ativa) {
    throw new Error('Ordem não encontrada no painel.');
  }
  
  return {
    etapa_atual: ativa.etapa_atual,
    status: ativa.status,
    slug_cancelamento: ativa.slug_cancelamento
  } as AcompanhamentoData;
};

export const getHistorico = async () => {
  const res = await http.get<{ data: { historico: OrdemServico[] } }>('/api/shared/historico/');
  return res.data.historico;
};

export const getPainelCliente = () =>
  http.get<PainelClienteResponse>('/api/cliente/painel/');


export const createAgendamento = (data: AgendamentoPayload) =>
  http.post<OrdemServico>('/api/cliente/agendamentos/', data);

export const avaliarOrdemServico = (id: number, estrelas: number) =>
  http.post<{ detail: string; estrelas: number }>(`/api/cliente/operacao/${id}/avaliar/`, { estrelas });

export interface GaleriaHistorico {
  entrada: { id: number; momento: string; arquivo_url: string }[];
  finalizacao: { id: number; momento: string; arquivo_url: string }[];
  laudo_tecnico: {
    servico_realizado: string;
    tempo_execucao_minutos: number | null;
    observacoes: string;
    status_final: string;
    status_final_display: string;
    placa: string;
    veiculo_modelo: string;
    unidade: string;
    data_servico: string;
  };
}

export const getGaleriaHistorico = async (osId: number) => {
  const res = await http.get<{ data: GaleriaHistorico }>(`/api/shared/historico/${osId}/galeria/`);
  return res.data;
};

export const cancelarAgendamento = (slugCancelamento: string, motivo: string = '') =>
  http.patch<{ detail: string }>(`/api/publico/agendamento/ordens-servico/${slugCancelamento}/cancelar/`, { motivo_cancelamento: motivo });