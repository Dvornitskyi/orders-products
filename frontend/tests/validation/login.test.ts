import { describe, expect, it } from 'vitest';
import { validateLogin } from '@/validation/login';

describe('validateLogin', () => {
  it('checks lengths', () => expect(validateLogin({ login: 'ad', password: '123' })).toEqual({ login: 'errLogin', password: 'errPassword' }));
  it('accepts valid credentials', () => expect(validateLogin({ login: 'admin', password: 'admin123' })).toEqual({}));
});
