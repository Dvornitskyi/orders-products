import { ApiError } from './errors';
import type { Order, Product, User } from '@/types';

// На сервере (SSR) идём прямо на бэкенд, в браузере — на /api своего домена (см. rewrites в next.config.mjs)
const base = () => (typeof window === 'undefined' ? process.env.INTERNAL_API_URL ?? 'http://localhost:4000' : '');

async function request<T>(path: string, init: RequestInit & { token?: string | null } = {}): Promise<T> {
  const { token, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(base() + path, {
      ...rest, cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...rest.headers }
    });
  } catch { throw new ApiError(0, []); } // сеть недоступна
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.errors ?? (body.error ? [body.error] : []));
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export interface ProductFilter { type?: string; specification?: string }
export interface OrderBody { title: string; description: string; lat: number | null; lng: number | null }
export interface ProductBody {
  title: string; serialNumber: number; type: string; specification: string; isNew: boolean; orderId: number;
  priceUsd: number; priceUah: number; guaranteeStart: string; guaranteeEnd: string;
}

export const api = {
  login: (login: string, password: string) =>
    request<{ token: string; login: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ login, password }) }),
  users: (token: string | null) => request<User[]>('/api/users', { token }),
  orders: () => request<Order[]>('/api/orders'),
  createOrder: (body: OrderBody, token: string | null) =>
    request<{ id: number }>('/api/orders', { method: 'POST', body: JSON.stringify(body), token }),
  deleteOrder: (id: number, token: string | null) => request<void>(`/api/orders/${id}`, { method: 'DELETE', token }),
  products: ({ type = '', specification = '' }: ProductFilter = {}) => {
    const qs = new URLSearchParams();
    if (type) qs.set('type', type);
    if (specification) qs.set('specification', specification);
    return request<Product[]>(`/api/products${qs.size ? `?${qs}` : ''}`);
  },
  productSpecifications: () => request<string[]>('/api/products/specifications'),
  productTypes: () => request<string[]>('/api/products/types'),
  createProduct: (body: ProductBody, token: string | null) =>
    request<{ id: number }>('/api/products', { method: 'POST', body: JSON.stringify(body), token }),
  deleteProduct: (id: number, token: string | null) => request<void>(`/api/products/${id}`, { method: 'DELETE', token })
};
