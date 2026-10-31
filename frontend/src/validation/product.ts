import type { Errors } from './errors';
import { isBlank, isNonNegative, isPositiveInteger, shorterThan } from './rules';

export interface ProductValues {
  title: string; serialNumber: string; type: string; specification: string; priceUsd: string; priceUah: string;
  guaranteeStart: string; guaranteeEnd: string; isNew: boolean;
}

export function validateProduct(v: ProductValues): Errors<ProductValues> {
  const e: Errors<ProductValues> = {};
  if (shorterThan(v.title, 3)) e.title = 'errTitle';
  if (!isPositiveInteger(v.serialNumber)) e.serialNumber = 'errSerial';
  if (isBlank(v.type)) e.type = 'errType';
  if (!isNonNegative(v.priceUsd)) e.priceUsd = 'errPrice';
  if (!isNonNegative(v.priceUah)) e.priceUah = 'errPrice';
  if (!v.guaranteeStart) e.guaranteeStart = 'errDate';
  if (!v.guaranteeEnd) e.guaranteeEnd = 'errDate';
  else if (v.guaranteeStart && v.guaranteeEnd < v.guaranteeStart) e.guaranteeEnd = 'errDateOrder'; // ISO-даты сравниваются как строки
  return e;
}
