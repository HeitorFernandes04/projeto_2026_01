const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('lm_access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    unauthorizedHandler?.();
    throw new Error('Sessão expirada');
  }

  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try { body = await res.json(); } catch { /* empty */ }
    const msg = (body.detail as string) ?? `Erro ${res.status}`;
    const err = new Error(msg) as Error & { status: number; body: unknown };
    (err as unknown as Record<string, unknown>).status = res.status;
    (err as unknown as Record<string, unknown>).body = body;
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const http = {
  get:   <T>(path: string)              => request<T>(path),
  post:  <T>(path: string, body: unknown, headers?: Record<string, string>) => request<T>(path, { method: 'POST', body: JSON.stringify(body), headers }),
  patch: <T>(path: string, body: unknown, headers?: Record<string, string>) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body), headers }),
  delete:(path: string)                 => request<void>(path, { method: 'DELETE' }),
};
