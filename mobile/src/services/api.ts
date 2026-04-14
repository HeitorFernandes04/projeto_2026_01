// A URL base é lida do arquivo .env (variável VITE_API_URL).
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

// --- INTERFACES DE TIPAGEM ---

interface DadosAvancoEtapa {
  laudo_vistoria?: string;
  comentario_lavagem?: string;
  comentario_acabamento?: string;
}

interface DadosIncidente {
  descricao: string;
  tag_peca_id: number;
  foto: File | null;
}

// Interface atualizada conforme nova estrutura de Ordem de Serviço
// Localize esta interface no seu api.ts e substitua:
interface DadosNovaOS {
  veiculo_id?: number; // Marcado como opcional com '?'
  placa: string;
  modelo: string;
  marca: string;
  cor: string;
  nome_dono: string;
  celular_dono: string;
  servico_id: number;
  data_hora: string;
  origem: 'AGENDADO' | 'AVULSO'; // Conforme diretriz 
  observacoes: string;
  iniciar_agora?: boolean;
}
// --- FUNÇÃO BASE DE REQUISIÇÃO ---

async function request(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('access');
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    globalThis.location.href = '/login';
    throw new Error('Sessão expirada.');
  }

  if (!response.ok) {
    const errText = await response.text();
    let erroDetalhado = '';
    try {
      const errJson = JSON.parse(errText);
      erroDetalhado = errJson.detail || errJson.message || errJson[Object.keys(errJson)[0]][0] || errText;
    } catch {
      erroDetalhado = errText || response.statusText;
    }
    throw new Error(erroDetalhado);
  }

  return response.status === 204 ? null : response.json();
}

// --- AUTENTICAÇÃO ---

export async function loginUsuario(email: string, password: string) {
  const response = await fetch(`${BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.detail || 'E-mail ou senha inválidos.');
  }
  return response.json();
}

// --- ORDENS DE SERVIÇO (ANTIGOS ATENDIMENTOS) ---

// RF-03 — Lista atendimentos do dia
export async function getAtendimentosHoje() {
  return request('/api/atendimentos/hoje/');
}

// RF-10 — Lista histórico por período
export async function getHistoricoAtendimentos(dataInicial: string, dataFinal: string) {
  const params = new URLSearchParams({
    data_inicial: dataInicial,
    data_final: dataFinal,
  });
  return request(`/api/atendimentos/historico/?${params.toString()}`, {
    cache: 'no-store',
  });
}

export async function getAtendimento(id: number) {
  return request(`/api/atendimentos/${id}/`);
}

export async function iniciarAtendimento(id: number) {
  return request(`/api/atendimentos/${id}/iniciar/`, { method: 'PATCH' });
}

export async function finalizarAtendimento(id: number) {
  return request(`/api/atendimentos/${id}/finalizar/`, { method: 'PATCH' });
}

// RF-05/06 — Envia fotos (Categorias atualizadas conforme diretriz) 
export async function uploadFotos(id: number, momento: 'VISTORIA_GERAL' | 'AVARIA_PREVIA' | 'EXECUCAO' | 'FINALIZADO', fotoBlob: Blob) {
  const formData = new FormData();
  formData.append('momento', momento);
  formData.append('arquivos', fotoBlob, 'foto.jpg');

  return request(`/api/atendimentos/${id}/fotos/`, {
    method: 'POST',
    body: formData,
  });
}

/**
 * RF-04 — Cria uma nova Ordem de Serviço
 * CORREÇÃO DO ERRO 405: Verifique se sua rota no Django não mudou para /api/ordens-servico/
 */
export async function criarAtendimento(dados: DadosNovaOS) {
  return request('/api/atendimentos/novo/', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export async function getServicos() {
  return request('/api/atendimentos/servicos/');
}

export async function getHorariosLivres(data: string, servicoId: number) {
  return request(`/api/atendimentos/horarios-livres/?data=${data}&servico_id=${servicoId}`, {
    cache: 'no-store',
  });
}

// --- ESTEIRA INDUSTRIAL ---

export async function avancarEtapa(id: number, dados: DadosAvancoEtapa) {
  return request(`/api/atendimentos/${id}/avancar-etapa/`, {
    method: 'PATCH',
    body: JSON.stringify(dados), 
  });
}

export async function finalizarAtendimentoEtapa4(id: number, dados: {
  vaga_patio: string;
  observacoes?: string;
}) {
  return request(`/api/atendimentos/${id}/finalizar-industrial/`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  });
}

// --- INCIDENTES E OCORRÊNCIAS ---

export async function getTagsPeca() {
  return request('/api/atendimentos/tags-peca/');
}

export async function registrarIncidente(id: number, dados: DadosIncidente) {
  const formData = new FormData();
  formData.append('descricao', dados.descricao);
  formData.append('tag_peca_id', dados.tag_peca_id.toString());
  
  if (dados.foto) {
    formData.append('foto_url', dados.foto);
  }
  
  return request(`/api/atendimentos/${id}/incidente/`, {
    method: 'POST',
    body: formData,
  });
}

// --- UTILITÁRIOS ---

export async function getAtendimentosPorData(data: string) {
  return request(`/api/atendimentos/dia/?data=${data}`, {
    cache: 'no-store',
  });
}