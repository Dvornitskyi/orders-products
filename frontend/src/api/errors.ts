import type { ErrorPayload } from '@/types';

export class ApiError extends Error {
  constructor(public status: number, public errors: string[]) { super(errors[0] ?? `HTTP ${status}`); }
}
// Превращает любую ошибку в объект, который можно положить в Redux (он должен быть сериализуемым)
export const toPayload = (e: unknown): ErrorPayload =>
  e instanceof ApiError ? { status: e.status, errors: e.errors } : { status: 0, errors: [] };
