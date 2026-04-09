// A URL base é lida do arquivo .env (variável VITE_API_URL).
// Em dispositivos físicos, ajuste o .env para o IP da máquina na rede local.
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

async function request(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('access');
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Mescla headers customizados com segurança
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Verificar se o response é válido antes de processar
  if (!response) {
    throw new Error('Resposta inválida do servidor');
  }

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

// Autenticação — Login do usuário
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

// RF-03 — Lista atendimentos do dia
export async function getAtendimentosHoje() {
  const token = localStorage.getItem('access');
  if (!token) {
    throw new Error('Usuário não autenticado');
  }
  return request('/api/atendimentos/hoje/');
}

// RF-10 — Lista histórico de atendimentos por período
export async function getHistoricoAtendimentos(dataInicial: string, dataFinal: string, search?: string) {
  const params = new URLSearchParams({
    data_inicial: dataInicial,
    data_final: dataFinal,
  });

  // Adiciona parâmetro de busca se fornecido
  if (search && search.trim()) {
    params.append('search', search.trim());
  }

  return request(`/api/atendimentos/historico/?${params.toString()}`, {
    cache: 'no-store',
  });
}

// RF-04 — Detalhe de um atendimento
interface Atendimento {
  id: number;
  nome_dono: string;
  celular_dono: string;
  placa: string;
  modelo: string;
  marca: string;
  cor: string;
  servico_id: number;
  data_hora: string;
  observacoes: string;
  status: string;
}

export async function getAtendimento(id: number): Promise<Atendimento> {
  return request(`/api/atendimentos/${id}/`);
}

// RF-07 - Avança para a próxima etapa da máquina de estados
export async function avancarEtapa(id: number, dados: any) {
  try {
    return request(`/api/atendimentos/${id}/proxima_etapa/`, {
      method: 'PATCH',
      body: JSON.stringify(dados),
      signal: AbortSignal.timeout(30000), // 30 segundos timeout
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Tempo de resposta excedido');
    } else if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro desconhecido');
    }
  }
}

// RF-07 - Finaliza atendimento na etapa 4 (Liberação)
export async function finalizarAtendimentoEtapa4(id: number, dados: {
  vaga_patio: string;
  observacoes?: string;
}) {
  try {
    return request(`/api/atendimentos/${id}/finalizar/`, {
      method: 'PATCH',
      body: JSON.stringify(dados),
      signal: AbortSignal.timeout(30000), // 30 segundos timeout
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Tempo de resposta excedido');
    } else if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro desconhecido');
    }
  }
}

// RF-XX - Registrar ocorrência
export async function registrarOcorrencia(id: number, dados: FormData) {
  return request(`/api/atendimentos/${id}/ocorrencia/`, {
    method: 'POST',
    body: dados,
  });
}

// RF-04 — Inicia um atendimento
export async function iniciarAtendimento(id: number) {
  return request(`/api/atendimentos/${id}/iniciar/`, { method: 'PATCH' });
}


// RF-05/06 — Envia fotos de um atendimento
export async function uploadFotos(id: number, momento: 'ANTES' | 'DEPOIS', fotoBlob: Blob) {
  const formData = new FormData();
  formData.append('momento', momento);
  formData.append('arquivos', fotoBlob, 'foto.jpg');

  return request(`/api/atendimentos/${id}/fotos/`, {
    method: 'POST',
    body: formData,
  });
}

// RF-04 — Cria um novo atendimento
export async function criarAtendimento(dados: {
  nome_dono: string;
  celular_dono: string;
  placa: string;
  modelo: string;
  marca: string;
  cor: string;
  servico_id: number;
  data_hora: string;
  observacoes: string;
  iniciar_agora?: boolean;
}) {
  return request('/api/atendimentos/', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

// RF-04 — Lista serviços disponíveis (para o dropdown)
export async function getServicos() {
  return request('/api/atendimentos/servicos/');
}

// RF-09 — Obtém horários livres para agendamento
export async function getHorariosLivres(data: string, servicoId: number) {
  // Passamos cache: 'no-store' para garantir que os slots livres sejam sempre frescos
  return request(`/api/atendimentos/horarios-livres/?data=${data}&servico_id=${servicoId}`, {
    cache: 'no-store',
  });
}

export async function adicionarComentario(id: number, observacoes: string) {
  return request(`/api/atendimentos/${id}/comentario/`, {
    method: 'PATCH',
    body: JSON.stringify({ observacoes }),
  });
}

// === API de Ordem de Serviço ===

// Lista ordens de serviço com filtros opcionais
export async function getOrdensServico(params: Record<string, string> = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `/api/atendimentos/ordens-servico/?${queryString}` : '/api/atendimentos/ordens-servico/';
  return request(url);
}

// Obtém detalhes de uma ordem de serviço específica
export async function getOrdemServico(id: number) {
  return request(`/api/atendimentos/ordens-servico/${id}/`);
}

// Cria uma nova ordem de serviço
export async function criarOrdemServico(dados: {
  atendimento_id: number;
  descricao?: string;
  etapas?: Array<{
    nome: string;
    tempo_estimado: string;
    ordem?: number;
  }>;
  materiais?: Array<{
    nome: string;
    quantidade: string;
    unidade: string;
    custo_unitario: string;
  }>;
}) {
  return request('/api/atendimentos/ordens-servico/', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

// Atualiza uma ordem de serviço (status, descrição)
export async function atualizarOrdemServico(id: number, dados: {
  status?: string;
  descricao?: string;
}) {
  return request(`/api/atendimentos/ordens-servico/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  });
}

// Finaliza uma ordem de serviço
export async function finalizarOrdemServico(id: number, dados: {
  observacoes?: string;
}) {
  return request(`/api/atendimentos/ordens-servico/${id}/finalizar/`, {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

// Adiciona material a uma ordem de serviço
export async function adicionarMaterialOS(id: number, material: {
  nome: string;
  quantidade: string;
  unidade: string;
  custo_unitario: string;
}) {
  return request(`/api/atendimentos/ordens-servico/${id}/materiais/`, {
    method: 'POST',
    body: JSON.stringify(material),
  });
}

// Atualiza status de uma etapa da ordem de serviço
export async function atualizarEtapaOS(id: number, etapaId: number, dados: {
  concluida: boolean;
}) {
  return request(`/api/atendimentos/ordens-servico/${id}/etapas/${etapaId}/`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  });
}