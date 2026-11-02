import type { ErrorPayload } from '@/types';

export class ApiError extends Error {
  constructor(public status: number, public errors: string[]) { super(errors[0] ?? `HTTP ${status}`); }
}
// Превращает любую ошибку в объект, который можно положить в Redux (он должен быть сериализуемым)
export const toPayload = (e: unknown): ErrorPayload =>
  e instanceof ApiError ? { status: e.status, errors: e.errors } : { status: 0, errors: [] };

// GraphQL всегда отвечает HTTP 200, а о проблеме сообщает кодом внутри ответа (extensions.code).
// Переводим эти коды обратно в привычные HTTP-статусы, чтобы остальной код (Redux, формы) не знал, REST это или GraphQL.
export interface GraphQLErrorItem { message: string; extensions?: { code?: string; errors?: string[] } }
const CODE_TO_STATUS: Record<string, number> = { UNAUTHENTICATED: 401, BAD_USER_INPUT: 400, NOT_FOUND: 404 };
export function fromGraphQLError(e: GraphQLErrorItem): ApiError {
  const code = e.extensions?.code ?? '';
  return new ApiError(CODE_TO_STATUS[code] ?? 500, e.extensions?.errors ?? (code === 'BAD_USER_INPUT' ? [e.message] : []));
}
