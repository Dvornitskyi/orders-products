'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { saveLocale } from '@/utils/storage';
import { dictionaries, isLocale, pluralKey, productTypeLabel, type Locale, type MessageKey } from './dictionaries';

interface I18n {
  locale: Locale; setLocale: (l: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  months: string[]; weekdays: string[]; productsWord: (n: number) => string;
  typeLabel: (raw: string) => string; // перевод типа продукта (Monitors → Мониторы)
}
const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);

  const setLocale = useCallback((l: Locale) => { if (isLocale(l)) { setLocaleState(l); saveLocale(l); } }, []);
  const value = useMemo<I18n>(() => {
    const dict = dictionaries[locale];
    const t: I18n['t'] = (key, vars) =>
      Object.entries(vars ?? {}).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), dict[key]);
    return {
      locale, setLocale, t, months: dict.months, weekdays: dict.weekdays,
      productsWord: (n) => dict[pluralKey(n, locale)],
      typeLabel: (raw) => productTypeLabel(locale, raw)
    };
  }, [locale, setLocale]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n must be used inside <I18nProvider>');
  return v;
}
