/**
 * Valida o formato de placas brasileiras.
 * Aceita: 
 * - Formato Antigo: ABC1234
 * - Formato Mercosul: ABC1D23
 */
export const validarPlaca = (placa: string): boolean => {
  // Remove o hífen da máscara antes de validar
  const cleaned = placa.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const regex = /^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$/;
  return regex.test(cleaned);
};

/**
 * Aplica máscara de placa veicular brasileira em tempo real.
 * Resultado: ABC-1234 (antiga) ou ABC-1A34 (Mercosul)
 */
export const maskPlaca = (value: string): string => {
  // Remove tudo que não é alfanumérico e força caixa alta
  const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  // Limita a 7 caracteres (sem o hífen)
  const truncated = cleaned.slice(0, 7);
  // Insere o hífen após os 3 primeiros caracteres
  if (truncated.length > 3) {
    return `${truncated.slice(0, 3)}-${truncated.slice(3)}`;
  }
  return truncated;
};

/**
 * Aplica máscara de telefone celular brasileiro em tempo real.
 * Resultado: (XX) 9XXXX-XXXX
 */
export const maskTelefone = (value: string): string => {
  // Remove tudo que não é dígito
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};
