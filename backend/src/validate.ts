type Body = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const num = (v: unknown) => (v === null || v === undefined || v === '' ? NaN : Number(v));

export function validateOrder(b: Body): string[] {
  const e: string[] = [];
  if (str(b.title).length < 3) e.push('title: min 3 chars');
  if (str(b.description).length > 500) e.push('description: max 500 chars');
  for (const [k, max] of [['lat', 90], ['lng', 180]] as const) {
    if (b[k] != null && !(Math.abs(num(b[k])) <= max)) e.push(`${k}: out of range`);
  }
  return e;
}

export function validateProduct(b: Body): string[] {
  const e: string[] = [];
  if (str(b.title).length < 3) e.push('title: min 3 chars');
  if (!Number.isInteger(num(b.serialNumber)) || num(b.serialNumber) <= 0) e.push('serialNumber: positive integer');
  if (!str(b.type)) e.push('type: required');
  if (!Number.isInteger(num(b.orderId))) e.push('orderId: required');
  for (const k of ['priceUsd', 'priceUah']) if (!(num(b[k]) >= 0)) e.push(`${k}: must be >= 0`);
  const start = str(b.guaranteeStart), end = str(b.guaranteeEnd);
  if (!start || !end || end < start) e.push('guarantee: end must not be before start');
  return e;
}
