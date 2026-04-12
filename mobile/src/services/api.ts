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
  return request('/api/atendimentos/hoje/');
}

// RF-10 — Lista histórico de atendimentos por período
export async function getHistoricoAtendimentos(dataInicial: string, dataFinal: string) {
  const params = new URLSearchParams({
    data_inicial: dataInicial,
    data_final: dataFinal,
  });

  return request(`/api/atendimentos/historico/?${params.toString()}`, {
    cache: 'no-store',
  });
}

// RF-03/04 — Detalhe de um atendimento
export async function getAtendimento(id: number) {
  return request(`/api/atendimentos/${id}/`);
}

// RF-04 — Inicia um atendimento
export async function iniciarAtendimento(id: number) {
  return request(`/api/atendimentos/${id}/iniciar/`, { method: 'PATCH' });
}

// RF-06 — Finaliza um atendimento
export async function finalizarAtendimento(id: number) {
  return request(`/api/atendimentos/${id}/finalizar/`, { method: 'PATCH' });
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

// RF-XX — Avança etapa de um atendimento
export async function avancarEtapa(id: number, etapa: string) {
  return request(`/api/atendimentos/${id}/avancar-etapa/`, {
    method: 'PATCH',
    body: JSON.stringify({ etapa }),
  });
}

// Adicione esta função ao seu arquivo src/services/api.ts
export async function getAtendimentosPorData(data: string) {
  return request(`/api/atendimentos/dia/?data=${data}`, {
    cache: 'no-store',
  });
}