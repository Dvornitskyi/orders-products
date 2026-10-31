import type { Errors } from './errors';

export interface LoginValues { login: string; password: string }

export function validateLogin(v: LoginValues): Errors<LoginValues> {
  const e: Errors<LoginValues> = {};
  if (v.login.trim().length < 3) e.login = 'errLogin';
  if (v.password.length < 6) e.password = 'errPassword';
  return e;
}
