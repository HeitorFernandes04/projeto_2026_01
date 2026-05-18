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
  data_agendamento: string;
  horario: string;
  valor: number;
  status: string;
  veiculo_placa: string;
  veiculo_modelo: string;
  veiculo_cor?: string;
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
}

export interface AcompanhamentoData {
  etapa_atual: number;
  status: string;
}

export interface ClientePerfil {
  id: number;
  nome: string;
  telefone: string;
  membro_desde: string;
  notificacoes_ativas?: boolean;
}

export interface Disponibilidade {
  horario: string;
  disponivel: boolean;
}

export interface AgendamentoPayload {
  slug: string;
  servico_id: number;
  veiculo_id: number;
  data: string;
  horario: string;
}

// — Public (sem auth) —

export async function getEstabelecimentos(): Promise<EstabelecimentoMapa[]> {
  const res = await fetch(`${BASE_URL}/api/publico/estabelecimentos/`);
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
  return res.json();
}

export async function solicitarOTP(telefone: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/publico/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telefone }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as Record<string, string>).detail ?? 'Falha ao solicitar código.');
  }
}

export async function verificarOTP(
  telefone: string,
  codigo: string,
): Promise<{ access: string; refresh: string; usuario: ClientePerfil }> {
  const res = await fetch(`${BASE_URL}/api/publico/auth/verificar/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telefone, codigo }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as Record<string, string>).detail ?? 'Código inválido.');
  }
  return res.json();
}

// — Authenticated —

export const getPerfil = () =>
  http.get<ClientePerfil>('/api/cliente/perfil/');

export const updatePerfil = (data: Partial<ClientePerfil>) =>
  http.patch<ClientePerfil>('/api/cliente/perfil/', data);

export const getVeiculos = () =>
  http.get<Veiculo[]>('/api/cliente/veiculos/');

export const getVeiculo = (id: number) =>
  http.get<Veiculo>(`/api/cliente/veiculos/${id}/`);

export const createVeiculo = (data: Omit<Veiculo, 'id'>) =>
  http.post<Veiculo>('/api/cliente/veiculos/', data);

export const updateVeiculo = (id: number, data: Partial<Omit<Veiculo, 'id'>>) =>
  http.patch<Veiculo>(`/api/cliente/veiculos/${id}/`, data);

export const getOrdens = () =>
  http.get<OrdemServico[]>('/api/cliente/ordens/');

export const getOrdemAtiva = () =>
  http.get<OrdemAtiva | null>('/api/cliente/ordens/ativa/');

export const getAcompanhamento = (osId: number) =>
  http.get<AcompanhamentoData>(`/api/operacao/acompanhamento/${osId}/`);

export const getHistorico = () =>
  http.get<OrdemServico[]>('/api/shared/historico/');

export const createAgendamento = (data: AgendamentoPayload) =>
  http.post<OrdemServico>('/api/cliente/agendamentos/', data);
