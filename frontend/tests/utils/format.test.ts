import { describe, expect, it } from 'vitest';
import { currencyLabel, formatLong, formatMoney, formatMonthOfYear, formatNumeric, parseDate } from '@/utils/format';

const MONTHS = 'Янв,Фев,Мар,Апр,Май,Июн,Июл,Авг,Сен,Окт,Ноя,Дек'.split(',');

describe('dates', () => {
  it('parses the backend format', () => {
    const d = parseDate('2017-04-06 12:09:33');
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2017, 3, 6, 12]);
  });
  it('formats in the three display formats', () => {
    expect(formatMonthOfYear('2017-04-06 12:09:33')).toBe('04 / 12');
    expect(formatLong('2017-04-06 12:09:33', MONTHS)).toBe('06 / Апр / 2017');
    expect(formatNumeric('2025-08-06 12:00:00')).toBe('06 / 08 / 2025');
  });
  it('accepts ISO strings with T', () => expect(formatNumeric('2017-04-06T12:00:00')).toBe('06 / 04 / 2017'));
});

describe('money', () => {
  it('groups thousands and hides zero cents', () => {
    expect(formatMoney(2500)).toBe('2 500');
    expect(formatMoney(250000.5)).toBe('250 000.50');
    expect(formatMoney(0)).toBe('0');
  });
  it('shows $ for USD and the code for others', () => {
    expect(currencyLabel('USD')).toBe('$');
    expect(currencyLabel('UAH')).toBe('UAH');
  });
});
