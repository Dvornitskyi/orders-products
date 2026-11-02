import type { Order, Product } from '@/types';
import { orderTotals } from './totals';

export type Direction = 'asc' | 'desc';
export type OrderSortKey = 'none' | 'date' | 'count' | 'total';
export type ProductSortKey = 'none' | 'title' | 'condition' | 'price' | 'date' | 'guarantee';

// Цена в основной валюте (та, у которой isDefault = 1)
const mainPrice = (p: Product) => p.price.find((x) => x.isDefault === 1)?.value ?? 0;
const orderTotal = (o: Order) => orderTotals(o.products).find((x) => x.isDefault)?.value ?? 0;

// Даты приходят как «ГГГГ-ММ-ДД ЧЧ:ММ:СС», поэтому обычное сравнение строк даёт правильный порядок
const cmp = (a: string | number, b: string | number) => (a < b ? -1 : a > b ? 1 : 0);

// Общая сортировка: ключ даёт значение для сравнения, направление переворачивает порядок.
// Одинаковые значения идут по id, чтобы порядок не «прыгал». Исходный массив не меняем.
function sortBy<T extends { id: number }>(items: T[], value: ((x: T) => string | number) | null, dir: Direction): T[] {
  if (!value) return items; // «по умолчанию» — как пришло с сервера
  const sign = dir === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => sign * cmp(value(a), value(b)) || a.id - b.id);
}

export const sortOrders = (orders: Order[], key: OrderSortKey, dir: Direction): Order[] =>
  sortBy(orders, { none: null, date: (o: Order) => o.date, count: (o: Order) => o.products.length, total: orderTotal }[key], dir);

export const sortProducts = (products: Product[], key: ProductSortKey, dir: Direction): Product[] =>
  sortBy(products, {
    none: null,
    title: (p: Product) => p.title.toLowerCase(),
    condition: (p: Product) => p.isNew, // по возрастанию: сначала Б/У, по убыванию: сначала новые
    price: mainPrice,
    date: (p: Product) => p.date,
    guarantee: (p: Product) => p.guarantee.end
  }[key], dir);
