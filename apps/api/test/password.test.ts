import { describe, expect, it } from 'vitest';
const valid = (password: string) => password.length >= 6 && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
describe('política de senha', () => { it('aceita senha segura', () => expect(valid('Orca@2026')).toBe(true)); it('recusa senha sem maiúscula', () => expect(valid('orca@2026')).toBe(false)); it('recusa senha sem caractere especial', () => expect(valid('Orca2026')).toBe(false)); });
