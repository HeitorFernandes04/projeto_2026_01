import { describe, it, expect } from 'vitest';
import { validarPlaca } from './validators';

describe('validarPlaca', () => {
  it('deve validar placas no formato antigo (ABC1234)', () => {
    expect(validarPlaca('ABC1234')).toBe(true);
    expect(validarPlaca('abc1234')).toBe(true); // Case check
    expect(validarPlaca('  ABC1234  ')).toBe(true); // Trimming
  });

  it('deve validar placas no formato Mercosul (ABC1D23)', () => {
    expect(validarPlaca('ABC1D23')).toBe(true);
    expect(validarPlaca('abc1d23')).toBe(true);
  });

  it('deve validar placas com máscara (ABC-1234)', () => {
    expect(validarPlaca('ABC-1234')).toBe(true);
    expect(validarPlaca('ABC-1D23')).toBe(true);
  });

  it('deve rejeitar placas com formatos inválidos', () => {
    expect(validarPlaca('AB1234')).toBe(false); // Curta
    expect(validarPlaca('ABC12345')).toBe(false); // Longa
    expect(validarPlaca('123ABCD')).toBe(false); // Invertida
    expect(validarPlaca('!!!@#$%')).toBe(false); // Símbolos
  });
});
