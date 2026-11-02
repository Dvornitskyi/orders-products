import { describe, it, expect } from 'vitest';
import { validateOrder, validateProduct } from '../src/validate';

const product = { title: 'Dell', serialNumber: 5, type: 'Monitors', orderId: 1, priceUsd: 1, priceUah: 26, guaranteeStart: '2020-01-01', guaranteeEnd: '2021-01-01' };

describe('validateOrder', () => {
  it('accepts a valid order', () => expect(validateOrder({ title: 'Приход', description: '' })).toEqual([]));
  it('rejects short title and bad coordinates', () => {
    expect(validateOrder({ title: 'ab', lat: 100 })).toHaveLength(2);
  });
});
describe('validateProduct', () => {
  it('accepts a valid product', () => expect(validateProduct(product)).toEqual([]));
  it('rejects reversed guarantee dates', () => expect(validateProduct({ ...product, guaranteeEnd: '2019-01-01' })).toHaveLength(1));
  it('rejects negative price', () => expect(validateProduct({ ...product, priceUsd: -1 })).toHaveLength(1));
});
