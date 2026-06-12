const BASE_URL = 'http://127.0.0.1:8000';

// --- INTERFACES DE TIPAGEM ---

interface DadosAvancoEtapa {
  laudo_vistoria?: string;
  comentario_lavagem?: string;
}

interface DadosIncidente {
  descricao: string;
  tag_peca_id: number;
  foto: File | null;
}

interface DadosNovaOS {
  placa: string;
  modelo: string;
  marca: string;
  cor: string;
  nome_dono: string;
  celular_dono: string;
  servico_id: number;
  data_hora: string;
  observacoes: string;
  iniciar_agora?: boolean;
}

interface ApiEnvelope<T> {
  data: T;
  meta: Record<string, string | number | null | undefined>;
  errors: Array<{ detail?: string }>;
}

interface OrdemServicoHistoricoResponse {
  id: number;
  veiculo: { placa: string; modelo: string; marca: string };
  servico: { nome: string; duracao_estimada_minutos: number };
  horario_finalizacao: string;
  status: string;
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
      const firstVal = errJson[Object.keys(errJson)[0]];
      // Se o valor for array extrai o primeiro item; se for string usa direto (sem fatiamento)
      const firstMsg = Array.isArray(firstVal) ? firstVal[0] : (typeof firstVal === 'string' ? firstVal : '');
      erroDetalhado = errJson.detail || errJson.message || firstMsg || errText;
    } catch {
      erroDetalhado = errText || response.statusText;
    }
    throw new Error(erroDetalhado);
  }

  return response.status === 204 ? null : response.json();
}

// --- AUTENTICAÇÃO ---

export async function passwordResetRequest(email: string) {
  const response = await fetch(`${BASE_URL}/api/auth/password-reset/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.detail || 'Não foi possível solicitar a redefinição de senha.');
  }
  return response.json();
}

export async function passwordResetConfirm(token: string, password: string) {
  const response = await fetch(`${BASE_URL}/api/auth/password-reset/confirm/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    // Se vier uma lista de erros (ex. password too common), vamos tentar exibir melhor
    let errMsg = errJson.password ? errJson.password.join(' ') : errJson.detail;
    throw new Error(errMsg || 'Erro ao redefinir a senha.');
  }
  return response.json();
}

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

export async function registerUsuario(dados: {
  name: string;
  email: string;
  username: string;
  password: string;
}) {
  const response = await fetch(`${BASE_URL}/api/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const primeiroErro = Object.values(data)[0];
    const msg = Array.isArray(primeiroErro) ? (primeiroErro as string[])[0] : (data.detail || 'Erro ao cadastrar.');
    throw new Error(msg);
  }
  return data;
}

// --- ORDENS DE SERVIÇO ---

/** RF-03 — Lista Ordens de Serviço do dia (Pátio) */
export async function getOrdensServicoHoje() {
  return request('/api/ordens-servico/hoje/', {
    cache: 'no-store'
  });
}

/** RF-10 — Lista histórico por período */
export async function getHistoricoOrdemServico(
  dataInicial: string,
  dataFinal: string
): Promise<OrdemServicoHistoricoResponse[]> {
  const params = new URLSearchParams({
    data_inicial: dataInicial,
    data_final: dataFinal,
  });
  const response = await request(`/api/shared/historico/?${params.toString()}`, {
    cache: 'no-store',
  }) as ApiEnvelope<OrdemServicoHistoricoResponse[]>;
  return response.data;
}

/** Busca detalhes de uma OS pelo ID */
export async function getOrdemServico(id: number) {
  return request(`/api/ordens-servico/${id}/`);
}

/** RF-05/06 — Envia múltiplas fotos de uma só vez */
export async function uploadFotos(
  id: number,
  momento: 'VISTORIA_GERAL' | 'AVARIA_PREVIA' | 'EXECUCAO' | 'FINALIZADO',
  fotoBlobs: Blob[]
) {
  const formData = new FormData();
  formData.append('momento', momento);
  
  fotoBlobs.forEach((blob, i) => {
    formData.append('arquivos', blob, `foto_${i + 1}.jpg`);
  });


  return request(`/api/ordens-servico/${id}/fotos/`, {
    method: 'POST',
    body: formData,
  });
}

export async function getMeuPerfil() {
  return request('/api/auth/meu_perfil/', {
    cache: 'no-store'
  });
}

/** RF-04 — Cria uma nova Ordem de Serviço */
export async function criarOrdemServico(dados: DadosNovaOS) {
  return request('/api/ordens-servico/novo/', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export async function getServicos() {
  return request('/api/gestao/servicos/');
}

export async function getHorariosLivres(data: string, servicoId: number) {
  return request(`/api/ordens-servico/horarios-livres/?data=${data}&servico_id=${servicoId}`, {
    cache: 'no-store',
  });
}

// --- ESTEIRA INDUSTRIAL ---

export async function avancarEtapa(id: number, dados: DadosAvancoEtapa) {
  return request(`/api/ordens-servico/${id}/avancar-etapa/`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  });
}

export async function finalizarOrdemServico(id: number, dados: {
  vaga_patio: string;
  observacoes?: string;
}) {
  return request(`/api/ordens-servico/${id}/finalizar/`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  });
}

export async function pausarOrdemServico(id: number) {
  return request(`/api/ordens-servico/${id}/pausar/`, {
    method: 'PATCH',
  });
}

export async function retomarOrdemServico(id: number) {
  return request(`/api/ordens-servico/${id}/retomar/`, {
    method: 'PATCH',
  });
}

// --- INCIDENTES ---

export async function getTagsPeca() {
  return request('/api/gestao/tags-peca/');
}

export async function registrarIncidente(id: number, dados: DadosIncidente) {
  const formData = new FormData();
  formData.append('descricao', dados.descricao);
  formData.append('tag_peca_id', dados.tag_peca_id.toString());

  if (dados.foto) {
    formData.append('foto_url', dados.foto);
  }

  return request(`/api/ordens-servico/${id}/incidente/`, {
    method: 'POST',
    body: formData,
  });
}
