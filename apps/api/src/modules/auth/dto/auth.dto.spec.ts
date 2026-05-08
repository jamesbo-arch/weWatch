import { describe, expect, it } from 'vitest';
import { RegisterSchema } from './register.dto.js';
import { LoginSchema } from './login.dto.js';

describe('RegisterSchema', () => {
  const valid = { email: 'designer@test.com', password: 'password123', brandName: 'My Studio' };

  it('accepts valid input', () => {
    expect(RegisterSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid email', () => {
    const r = RegisterSchema.safeParse({ ...valid, email: 'not-an-email' });
    expect(r.success).toBe(false);
  });

  it('rejects password shorter than 8 chars', () => {
    const r = RegisterSchema.safeParse({ ...valid, password: 'short' });
    expect(r.success).toBe(false);
  });

  it('rejects empty brandName', () => {
    const r = RegisterSchema.safeParse({ ...valid, brandName: '' });
    expect(r.success).toBe(false);
  });

  it('rejects brandName longer than 100 chars', () => {
    const r = RegisterSchema.safeParse({ ...valid, brandName: 'a'.repeat(101) });
    expect(r.success).toBe(false);
  });
});

describe('LoginSchema', () => {
  const valid = { email: 'user@test.com', password: 'anypassword' };

  it('accepts valid credentials', () => {
    expect(LoginSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects empty password', () => {
    const r = LoginSchema.safeParse({ email: valid.email, password: '' });
    expect(r.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const r = LoginSchema.safeParse({ ...valid, email: 'bad' });
    expect(r.success).toBe(false);
  });
});
