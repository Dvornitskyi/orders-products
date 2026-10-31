import { describe, expect, it } from 'vitest';
import { makeStore } from '@/store';
import { sessionRestored } from '@/store/authSlice';
import { setOrders } from '@/store/ordersSlice';
import { loadProducts, setProducts } from '@/store/productsSlice';
import { setQuery } from '@/store/searchSlice';

describe('redux store', () => {
  it('starts empty and not ready', () => {
    const s = makeStore().getState();
    expect(s.orders.items).toEqual([]);
    expect(s.auth).toEqual({ token: null, login: null, ready: false });
  });
  it('restores a session', () => {
    const store = makeStore();
    store.dispatch(sessionRestored({ token: 't', login: 'admin' }));
    expect(store.getState().auth).toEqual({ token: 't', login: 'admin', ready: true });
  });
  it('stores orders and products (SSR hydration actions)', () => {
    const store = makeStore();
    store.dispatch(setOrders([{ id: 1 } as never]));
    store.dispatch(setProducts({ items: [], types: ['Monitors'], specifications: ['Specification 1'] }));
    expect(store.getState().orders.items).toHaveLength(1);
    expect(store.getState().products.types).toEqual(['Monitors']);
  });
  it('keeps the search query in the store', () => {
    const store = makeStore();
    store.dispatch(setQuery('dell'));
    expect(store.getState().search.query).toBe('dell');
  });
  it('remembers selected filters immediately and ignores stale responses', () => {
    const store = makeStore();
    const pending = (id: string, arg: { type?: string; specification?: string }) =>
      ({ type: loadProducts.pending.type, meta: { requestId: id, arg } });
    const done = (id: string, arg: object, items: unknown[]) =>
      ({ type: loadProducts.fulfilled.type, payload: { f: arg, items }, meta: { requestId: id, arg } });
    store.dispatch(pending('a', { specification: 'S1' }));
    store.dispatch(pending('b', { type: 'Monitors', specification: 'S1' }));
    expect(store.getState().products).toMatchObject({ type: 'Monitors', specification: 'S1', loading: true });
    store.dispatch(done('b', {}, [{ id: 1 }, { id: 2 }]));
    store.dispatch(done('a', {}, [{ id: 9 }])); // запоздавший ответ на старый запрос
    expect(store.getState().products.items).toHaveLength(2);
  });
  it('creates independent stores (needed for per-request SSR state)', () => {
    const a = makeStore(), b = makeStore();
    a.dispatch(setOrders([{ id: 1 } as never]));
    expect(b.getState().orders.items).toEqual([]);
  });
});
