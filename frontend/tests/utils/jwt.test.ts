import { describe, expect, it } from 'vitest';
import { isExpired, tokenExpiresAt } from '@/utils/jwt';

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
const token = (exp: number) => `${b64({ alg: 'HS256' })}.${b64({ sub: 1, exp })}.signature`;

describe('jwt helpers', () => {
  it('reads exp in milliseconds', () => expect(tokenExpiresAt(token(2000000000))).toBe(2000000000 * 1000));
  it('detects expired and fresh tokens', () => {
    expect(isExpired(token(1000), 2_000_000)).toBe(true);
    expect(isExpired(token(5000), 2_000_000)).toBe(false);
  });
  it('treats garbage as expired', () => expect(isExpired('not-a-token')).toBe(true));
});
