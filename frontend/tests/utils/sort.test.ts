import { describe, expect, it } from 'vitest';
import { sortOrders, sortProducts } from '@/utils/sort';
import type { Order, Product } from '@/types';

const prod = (id: number, title: string, isNew: number, uah: number, date: string, end: string) =>
  ({ id, title, isNew, date, guarantee: { start: '2017-01-01 00:00:00', end }, price: [{ value: uah / 26, symbol: 'USD', isDefault: 0 }, { value: uah, symbol: 'UAH', isDefault: 1 }] }) as unknown as Product;

const a = prod(1, 'beta', 1, 500, '2017-06-01 00:00:00', '2025-01-01 00:00:00');
const b = prod(2, 'Alpha', 0, 100, '2018-06-01 00:00:00', '2024-01-01 00:00:00');
const c = prod(3, 'gamma', 1, 300, '2016-06-01 00:00:00', '2026-01-01 00:00:00');
const ids = (xs: { id: number }[]) => xs.map((x) => x.id);

describe('sortProducts', () => {
  const list = [a, b, c];
  it('keeps the server order by default and does not mutate the input', () => {
    expect(ids(sortProducts(list, 'none', 'asc'))).toEqual([1, 2, 3]);
    sortProducts(list, 'price', 'asc');
    expect(ids(list)).toEqual([1, 2, 3]);
  });
  it('sorts by title ignoring case', () => expect(ids(sortProducts(list, 'title', 'asc'))).toEqual([2, 1, 3]));
  it('sorts by price in the main currency', () => {
    expect(ids(sortProducts(list, 'price', 'asc'))).toEqual([2, 3, 1]);
    expect(ids(sortProducts(list, 'price', 'desc'))).toEqual([1, 3, 2]);
  });
  it('sorts by date and by warranty end', () => {
    expect(ids(sortProducts(list, 'date', 'asc'))).toEqual([3, 1, 2]);
    expect(ids(sortProducts(list, 'guarantee', 'desc'))).toEqual([3, 1, 2]);
  });
  it('puts new first when descending by condition, ties by id', () => {
    expect(ids(sortProducts(list, 'condition', 'desc'))).toEqual([1, 3, 2]);
    expect(ids(sortProducts(list, 'condition', 'asc'))).toEqual([2, 1, 3]);
  });
});

describe('sortOrders', () => {
  const o1 = { id: 1, date: '2017-06-01 00:00:00', products: [a, b] } as unknown as Order;   // 2 продукта, 600 грн
  const o2 = { id: 2, date: '2016-01-01 00:00:00', products: [c] } as unknown as Order;       // 1 продукт, 300 грн
  const o3 = { id: 3, date: '2018-01-01 00:00:00', products: [a, b, c] } as unknown as Order; // 3 продукта, 900 грн
  const list = [o1, o2, o3];
  it('sorts by date', () => expect(ids(sortOrders(list, 'date', 'desc'))).toEqual([3, 1, 2]));
  it('sorts by number of products', () => expect(ids(sortOrders(list, 'count', 'asc'))).toEqual([2, 1, 3]));
  it('sorts by total in the main currency', () => expect(ids(sortOrders(list, 'total', 'desc'))).toEqual([3, 1, 2]));
});
