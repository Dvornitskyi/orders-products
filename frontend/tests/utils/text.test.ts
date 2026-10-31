import { describe, expect, it } from 'vitest';
import { truncate } from '@/utils/text';

describe('truncate', () => {
  it('leaves short strings untouched', () => expect(truncate('Приход', 10)).toBe('Приход'));
  it('cuts long strings to max characters including the ellipsis', () => {
    const r = truncate('Длинное предлинное название', 10);
    expect(r).toHaveLength(10);
    expect(r.endsWith('…')).toBe(true);
  });
  it('does not leave a space before the ellipsis', () => expect(truncate('abc def ghi', 5)).toBe('abc…'));
});
