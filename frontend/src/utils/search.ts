import type { Order, Product } from '@/types';

// Совпадение без учёта регистра и лишних пробелов по краям. Пустой запрос подходит всему.
const has = (value: string | number | null | undefined, q: string) => String(value ?? '').toLowerCase().includes(q);
const norm = (q: string) => q.trim().toLowerCase();

// typeLabel (необязательно): функция перевода типа, чтобы поиск находил и по переведённому названию («мыши»)
export type TypeLabel = (raw: string) => string;

export function matchesProduct(p: Product, query: string, typeLabel?: TypeLabel): boolean {
  const q = norm(query);
  return !q || [p.title, p.serialNumber, p.type, typeLabel?.(p.type), p.specification, p.orderTitle].some((v) => has(v, q));
}

// Приход подходит, если совпало его название/описание или любой из его продуктов
export function matchesOrder(o: Order, query: string, typeLabel?: TypeLabel): boolean {
  const q = norm(query);
  return !q || has(o.title, q) || has(o.description, q) || o.products.some((p) => matchesProduct(p, q, typeLabel));
}
