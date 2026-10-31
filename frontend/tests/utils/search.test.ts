import { describe, expect, it } from 'vitest';
import { matchesOrder, matchesProduct } from '@/utils/search';
import type { Order, Product } from '@/types';

const product = { title: 'Dell U2415', serialNumber: 12345679, type: 'Monitors', specification: 'Specification 2', orderTitle: 'Приход А' } as Product;
const order = { title: 'Приход Б', description: 'Периферия', products: [product] } as Order;

describe('search', () => {
  it('empty query matches everything', () => {
    expect(matchesProduct(product, '')).toBe(true);
    expect(matchesProduct(product, '   ')).toBe(true);
    expect(matchesOrder(order, '')).toBe(true);
  });
  it('is case-insensitive and checks title, serial, type, specification and order title', () => {
    for (const q of ['dell', 'U2415', '12345679', 'monitors', 'specification 2', 'приход а']) expect(matchesProduct(product, q)).toBe(true);
    expect(matchesProduct(product, 'keyboard')).toBe(false);
  });
  it('an order matches by its own fields or by any of its products', () => {
    expect(matchesOrder(order, 'периферия')).toBe(true);
    expect(matchesOrder(order, 'dell')).toBe(true);
    expect(matchesOrder(order, 'nothing')).toBe(false);
  });
});
