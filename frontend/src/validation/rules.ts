// Маленькие переиспользуемые правила. Все принимают строку из поля формы.
// Форма хранит значения как строки, поэтому число сначала разбираем (запятая тоже допустима: "6500,50").
export const toNumber = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(',', '.')));

export const isBlank = (s: string) => s.trim() === '';
export const shorterThan = (s: string, min: number) => s.trim().length < min;
export const longerThan = (s: string, max: number) => s.trim().length > max;
export const isPositiveInteger = (s: string) => { const n = toNumber(s); return Number.isInteger(n) && n > 0; };
export const isNonNegative = (s: string) => toNumber(s) >= 0;           // NaN даёт false → "не число" тоже ошибка
export const isWithin = (s: string, limit: number) => Math.abs(toNumber(s)) <= limit;
