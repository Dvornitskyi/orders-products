import { describe, expect, it } from 'vitest';
import { ApiError, fromGraphQLError, toPayload } from '@/api/errors';

describe('GraphQL error mapping', () => {
  it('turns GraphQL codes back into HTTP-like statuses', () => {
    expect(fromGraphQLError({ message: 'x', extensions: { code: 'UNAUTHENTICATED' } }).status).toBe(401);
    expect(fromGraphQLError({ message: 'x', extensions: { code: 'NOT_FOUND' } }).status).toBe(404);
    expect(fromGraphQLError({ message: 'x', extensions: { code: 'INTERNAL_SERVER_ERROR' } }).status).toBe(500);
    expect(fromGraphQLError({ message: 'x' }).status).toBe(500);
  });
  it('carries validation messages', () => {
    const e = fromGraphQLError({ message: 'Validation failed', extensions: { code: 'BAD_USER_INPUT', errors: ['title: min 3 chars'] } });
    expect(e).toBeInstanceOf(ApiError);
    expect([e.status, e.errors]).toEqual([400, ['title: min 3 chars']]);
  });
  it('is serializable for Redux', () => {
    expect(toPayload(new ApiError(401, []))).toEqual({ status: 401, errors: [] });
    expect(toPayload(new Error('boom'))).toEqual({ status: 0, errors: [] });
  });
});
