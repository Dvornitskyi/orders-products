import { ApiError, fromGraphQLError, type GraphQLErrorItem } from './errors';
import type { Order, Product, User } from '@/types';

// На сервере (SSR) идём прямо на бэкенд, в браузере — на /api своего домена (см. rewrites в next.config.mjs)
const base = () => (typeof window === 'undefined' ? process.env.INTERNAL_API_URL ?? 'http://localhost:4000' : '');
const auth = (token?: string | null): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {});

// ---------- REST: вход и список пользователей ----------
async function request<T>(path: string, init: RequestInit & { token?: string | null } = {}): Promise<T> {
  const { token, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(base() + path, { ...rest, cache: 'no-store', headers: { 'Content-Type': 'application/json', ...auth(token), ...rest.headers } });
  } catch { throw new ApiError(0, []); } // сеть недоступна
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.errors ?? (body.error ? [body.error] : []));
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

// ---------- GraphQL: приходы и продукты ----------
// Один адрес, метод всегда POST. В теле — текст запроса и переменные; в ответе — ровно те поля, которые мы запросили.
async function gql<T>(query: string, variables?: object, token?: string | null): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${base()}/api/graphql`, {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...auth(token) },
      body: JSON.stringify({ query, variables })
    });
  } catch { throw new ApiError(0, []); }
  const body = (await res.json().catch(() => null)) as { data?: T; errors?: GraphQLErrorItem[] } | null;
  if (!body) throw new ApiError(res.status || 0, []);
  if (body.errors?.length) throw fromGraphQLError(body.errors[0]);
  return body.data as T;
}

const PRODUCT_FIELDS = `
  id serialNumber isNew photo title type specification order orderTitle date
  guarantee { start end }
  price { value symbol isDefault }`;

export interface ProductFilter { type?: string; specification?: string }
export interface OrderBody { title: string; description: string; lat: number | null; lng: number | null }
export interface ProductBody {
  title: string; serialNumber: number; type: string; specification: string; isNew: boolean; orderId: number;
  priceUsd: number; priceUah: number; guaranteeStart: string; guaranteeEnd: string;
}

export const api = {
  // REST
  login: (login: string, password: string) =>
    request<{ token: string; login: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ login, password }) }),
  users: (token: string | null) => request<User[]>('/api/users', { token }),

  // GraphQL
  orders: async () =>
    (await gql<{ orders: Order[] }>(`{ orders { id title description date lat lng products { ${PRODUCT_FIELDS} } } }`)).orders,
  createOrder: async (body: OrderBody, token: string | null) =>
    ({ id: (await gql<{ createOrder: number }>('mutation($input: OrderInput!) { createOrder(input: $input) }', { input: body }, token)).createOrder }),
  deleteOrder: async (id: number, token: string | null) => {
    await gql('mutation($id: Int!) { deleteOrder(id: $id) }', { id }, token);
  },
  products: async ({ type = '', specification = '' }: ProductFilter = {}) =>
    (await gql<{ products: Product[] }>(
      `query($type: String, $specification: String) { products(type: $type, specification: $specification) { ${PRODUCT_FIELDS} } }`,
      { type: type || null, specification: specification || null }
    )).products,
  productTypes: async () => (await gql<{ productTypes: string[] }>('{ productTypes }')).productTypes,
  productSpecifications: async () => (await gql<{ productSpecifications: string[] }>('{ productSpecifications }')).productSpecifications,
  createProduct: async (body: ProductBody, token: string | null) =>
    ({ id: (await gql<{ createProduct: number }>('mutation($input: ProductInput!) { createProduct(input: $input) }', { input: body }, token)).createProduct }),
  deleteProduct: async (id: number, token: string | null) => {
    await gql('mutation($id: Int!) { deleteProduct(id: $id) }', { id }, token);
  }
};
