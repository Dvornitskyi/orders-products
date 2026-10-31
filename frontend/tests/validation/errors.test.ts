import { describe, expect, it } from 'vitest';
import { keepUnfixed } from '@/validation/errors';
import { validateOrder } from '@/validation/order';

describe('keepUnfixed', () => {
  it('drops fixed errors and does not add errors to untouched fields', () => {
    const before = validateOrder({ title: 'ab', description: '', lat: '50', lng: '' });          // title, lat, lng
    const after = validateOrder({ title: 'abcd', description: '', lat: '50', lng: '' });         // title fixed, coordinates still broken
    expect(keepUnfixed(before, after)).toEqual({ lat: 'errCoords', lng: 'errCoords' });
    expect(keepUnfixed({}, after)).toEqual({});
  });
});
