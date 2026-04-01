const BASE_URL = 'http://127.0.0.1:8000';

async function request(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('access');

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    globalThis.location.href = '/login';
    throw new Error('Sessão expirada.');
  }

  if (!response.ok) {
    throw new Error(`Erro ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// RF-03 — Lista atendimentos do dia
export async function getAtendimentosHoje() {
  return request('/api/atendimentos/hoje/');
}

// RF-03/04 — Detalhe de um atendimento
export async function getAtendimento(id: number) {
  return request(`/api/atendimentos/${id}/`);
}

// RF-04 — Inicia um atendimento
export async function iniciarAtendimento(id: number) {
  return request(`/api/atendimentos/${id}/iniciar/`, { method: 'PATCH' });
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
