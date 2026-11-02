// Тексты интерфейса лежат в JSON-файлах: src/i18n/locales/{ru,uk,en}.json.
// Чтобы добавить или поправить перевод — меняете JSON. Чтобы добавить язык — новый файл + строка в LOCALES.
import en from './locales/en.json';
import ru from './locales/ru.json';
import uk from './locales/uk.json';

export const LOCALES = ['ru', 'uk', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);

// Эталон набора ключей — ru.json. uk.json и en.json обязаны содержать ТОЛЬКО эти ключи (иначе ошибка компиляции).
export type Messages = typeof ru;
export type MessageKey = { [K in keyof Messages]: Messages[K] extends string ? K : never }[keyof Messages];

export const dictionaries: Record<Locale, Messages> = { ru, uk, en };
export const LOCALE_LABELS: Record<Locale, string> = { ru: 'RU', uk: 'UA', en: 'EN' };

// Название типа продукта на языке интерфейса. В базе и в запросах остаётся исходное значение (Monitors),
// переводится только то, что видит пользователь. Неизвестный тип показываем как есть.
export const productTypeLabel = (locale: Locale, raw: string): string =>
  (dictionaries[locale].productTypes as Record<string, string>)[raw] ?? raw;

// Подбирает слово "продукт/продукта/продуктов" по правилам языка
export function pluralKey(n: number, locale: Locale): MessageKey {
  const cat = new Intl.PluralRules(locale === 'uk' ? 'uk' : locale).select(n);
  return ({ one: 'productsOne', few: 'productsFew', many: 'productsMany', other: 'productsOther' } as const)[
    cat as 'one' | 'few' | 'many' | 'other'] ?? 'productsOther';
}
