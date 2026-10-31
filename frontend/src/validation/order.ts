import type { Errors } from './errors';
import { isBlank, isWithin, longerThan, shorterThan } from './rules';

export interface OrderValues { title: string; description: string; lat: string; lng: string }

export function validateOrder(v: OrderValues): Errors<OrderValues> {
  const e: Errors<OrderValues> = {};
  if (shorterThan(v.title, 3)) e.title = 'errTitle';
  if (longerThan(v.description, 500)) e.description = 'errDescription';
  // Координаты необязательны, но только парой: либо обе, либо ни одной
  const hasLat = !isBlank(v.lat), hasLng = !isBlank(v.lng);
  if (hasLat !== hasLng) { e.lat = 'errCoords'; e.lng = 'errCoords'; }
  else if (hasLat) {
    if (!isWithin(v.lat, 90)) e.lat = 'errLat';
    if (!isWithin(v.lng, 180)) e.lng = 'errLng';
  }
  return e;
}
