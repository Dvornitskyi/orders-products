import { describe, expect, it } from 'vitest';
import { isNonNegative, isPositiveInteger, isWithin, toNumber } from '@/validation/rules';

describe('rules', () => {
  it('parses numbers with comma or dot, blank is NaN', () => {
    expect(toNumber('6500,50')).toBe(6500.5);
    expect(toNumber('  ')).toBeNaN();
  });
  it('isPositiveInteger', () => { expect(isPositiveInteger('5')).toBe(true); for (const s of ['0', '1.5', '', 'x']) expect(isPositiveInteger(s)).toBe(false); });
  it('isNonNegative treats "not a number" as invalid', () => { expect(isNonNegative('0')).toBe(true); expect(isNonNegative('-1')).toBe(false); expect(isNonNegative('')).toBe(false); });
  it('isWithin checks the absolute value', () => { expect(isWithin('-90', 90)).toBe(true); expect(isWithin('91', 90)).toBe(false); });
});
