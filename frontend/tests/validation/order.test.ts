import { describe, expect, it } from 'vitest';
import { validateOrder } from '@/validation/order';

describe('validateOrder', () => {
  it('accepts valid data', () => expect(validateOrder({ title: 'Приход', description: '', lat: '50.45', lng: '30.52' })).toEqual({}));
  it('requires a title of 3+ characters', () => expect(validateOrder({ title: 'ab', description: '', lat: '', lng: '' }).title).toBe('errTitle'));
  it('requires both coordinates or none', () => {
    expect(validateOrder({ title: 'abc', description: '', lat: '50', lng: '' }).lng).toBe('errCoords');
  });
  it('checks coordinate ranges', () => {
    const e = validateOrder({ title: 'abc', description: '', lat: '95', lng: '200' });
    expect([e.lat, e.lng]).toEqual(['errLat', 'errLng']);
  });
});
