import { describe, expect, it } from 'vitest';
import { validateProduct, type ProductValues } from '@/validation/product';

const ok: ProductValues = { title: 'Dell U2415', serialNumber: '123', type: 'Monitors', specification: '', priceUsd: '250', priceUah: '6500,50',
  guaranteeStart: '2020-01-01', guaranteeEnd: '2021-01-01', isNew: true };

describe('validateProduct', () => {
  it('accepts valid data (comma decimal too)', () => expect(validateProduct(ok)).toEqual({}));
  it('rejects bad serial number and negative price', () => {
    const e = validateProduct({ ...ok, serialNumber: '1.5', priceUsd: '-1' });
    expect([e.serialNumber, e.priceUsd]).toEqual(['errSerial', 'errPrice']);
  });
  it('rejects guarantee end before start', () => expect(validateProduct({ ...ok, guaranteeEnd: '2019-01-01' }).guaranteeEnd).toBe('errDateOrder'));
  it('requires dates', () => expect(validateProduct({ ...ok, guaranteeStart: '', guaranteeEnd: '' }).guaranteeStart).toBe('errDate'));
});
