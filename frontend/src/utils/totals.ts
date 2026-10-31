import type { Product } from '@/types';

export interface Total { symbol: string; value: number; isDefault: boolean }

// Сумма прихода = сумма цен всех его продуктов, отдельно по каждой валюте
export function orderTotals(products: Product[]): Total[] {
  const map = new Map<string, Total>();
  for (const p of products) {
    for (const pr of p.price) {
      const cur = map.get(pr.symbol) ?? { symbol: pr.symbol, value: 0, isDefault: pr.isDefault === 1 };
      map.set(pr.symbol, { ...cur, value: Math.round((cur.value + pr.value) * 100) / 100 });
    }
  }
  return [...map.values()].sort((a, b) => Number(a.isDefault) - Number(b.isDefault)); // дополнительная валюта первой
}
