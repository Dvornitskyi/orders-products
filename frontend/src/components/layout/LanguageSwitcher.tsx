'use client';
import { LOCALES, LOCALE_LABELS } from '@/i18n/dictionaries';
import { useI18n } from '@/i18n/I18nProvider';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="lang" role="group" aria-label="Language">
      {LOCALES.map((l) => (
        <button key={l} type="button" className={`lang__btn ${l === locale ? 'lang__btn--active' : ''}`} onClick={() => setLocale(l)}>
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
