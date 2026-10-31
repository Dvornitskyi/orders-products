import { describe, expect, it } from 'vitest';
import { orderTotals } from '@/utils/totals';
import { totalsChart, typesChart } from '@/utils/stats';
import type { Order, Product } from '@/types';

const product = (id: number, type: string, usd: number, uah: number): Product => ({
  id, serialNumber: id, isNew: 1, photo: 'monitor.svg', title: `P${id}`, type, specification: '',
  guarantee: { start: '2017-01-01 00:00:00', end: '2018-01-01 00:00:00' }, order: 1, orderTitle: 'O', date: '2017-01-01 00:00:00',
  price: [{ value: usd, symbol: 'USD', isDefault: 0 }, { value: uah, symbol: 'UAH', isDefault: 1 }]
});
const order: Order = { id: 1, title: 'O', description: '', date: '2017-01-01 00:00:00', lat: null, lng: null,
  products: [product(1, 'Monitors', 100.1, 2600), product(2, 'Mice', 0.2, 10.5), product(3, 'Monitors', 50, 100)] };

describe('orderTotals', () => {
  it('sums prices per currency, secondary currency first', () => {
    expect(orderTotals(order.products)).toEqual([
      { symbol: 'USD', value: 150.3, isDefault: false },
      { symbol: 'UAH', value: 2710.5, isDefault: true }
    ]);
  });
  it('returns an empty list for an order without products', () => expect(orderTotals([])).toEqual([]));
});
describe('charts data', () => {
  it('builds bar data in the chosen currency', () => expect(totalsChart([order], 'UAH')[0].value).toBe(2710.5));
  it('counts products by type', () => expect(typesChart([order])).toEqual([{ name: 'Monitors', value: 2 }, { name: 'Mice', value: 1 }]));
  it('labels bars with id and a shortened title, keeps the full title, sorts by value descending', () => {
    const long = { ...order, id: 7, title: 'Очень длинное название прихода которое не поместится' } as Order;
    const rows = totalsChart([{ ...order, id: 1 } as Order, long], 'UAH');
    const row = rows.find((r) => r.title === long.title)!;
    expect(row.name.startsWith('#7 ')).toBe(true);
    expect(row.name.length).toBeLessThanOrEqual(3 + 26);
    expect(rows[0].value).toBeGreaterThanOrEqual(rows[1].value);
  });
});
