import type { Order } from '@/types';
import { orderTotals } from './totals';
import { truncate } from './text';

// Данные для столбчатой диаграммы: сумма каждого прихода в выбранной валюте, от большей к меньшей.
// name — подпись на оси: номер + обрезанное название (номер нужен, потому что начало названий бывает одинаковым). title — полное название для подсказки.
export const totalsChart = (orders: Order[], symbol: string) =>
  orders
    .map((o) => ({ name: `#${o.id} ${truncate(o.title, 26)}`, title: o.title, value: orderTotals(o.products).find((x) => x.symbol === symbol)?.value ?? 0 }))
    .sort((a, b) => b.value - a.value);

// Данные для круговой диаграммы: сколько продуктов каждого типа
export function typesChart(orders: Order[]) {
  const counts = new Map<string, number>();
  for (const p of orders.flatMap((o) => o.products)) counts.set(p.type, (counts.get(p.type) ?? 0) + 1);
  return [...counts].map(([name, value]) => ({ name, value }));
}
