import { describe, expect, it } from 'vitest';
import { dictionaries, LOCALES, pluralKey, productTypeLabel } from '@/i18n/dictionaries';

describe('dictionaries', () => {
  it('have identical keys in every language', () => {
    const base = Object.keys(dictionaries.ru).sort();
    for (const l of LOCALES) expect(Object.keys(dictionaries[l]).sort()).toEqual(base);
  });
  it('have 12 months and 7 weekdays', () => {
    for (const l of LOCALES) {
      expect(dictionaries[l].months).toHaveLength(12);
      expect(dictionaries[l].weekdays).toHaveLength(7);
    }
  });
  it('picks the right plural form', () => {
    expect(pluralKey(1, 'ru')).toBe('productsOne');
    expect(pluralKey(3, 'ru')).toBe('productsFew');
    expect(pluralKey(23, 'ru')).toBe('productsFew'); // 23 → «продукта»
    expect(pluralKey(11, 'ru')).toBe('productsMany');
    expect(pluralKey(1, 'en')).toBe('productsOne');
    expect(pluralKey(2, 'en')).toBe('productsOther');
  });
  it('have the same product types in every language', () => {
    const base = Object.keys(dictionaries.ru.productTypes).sort();
    for (const l of LOCALES) expect(Object.keys(dictionaries[l].productTypes).sort()).toEqual(base);
  });
  it('translates product types and keeps unknown ones as is', () => {
    expect(productTypeLabel('ru', 'Mice')).toBe('Мыши');
    expect(productTypeLabel('uk', 'Keyboards')).toBe('Клавіатури');
    expect(productTypeLabel('en', 'Monitors')).toBe('Monitors');
    expect(productTypeLabel('ru', 'Gadgets')).toBe('Gadgets');
  });
});
