'use client';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/dictionaries';

interface Props {
  id: string; label: string; value: string; onChange: (v: string) => void; error?: MessageKey;
  type?: string; multiline?: boolean; list?: string; step?: string;
}
// Поле формы на Bootstrap: класс is-invalid + invalid-feedback показывают ошибку валидации
export default function TextField({ id, label, value, onChange, error, type = 'text', multiline, list, step }: Props) {
  const { t } = useI18n();
  const common = {
    id, value, className: `form-control ${error ? 'is-invalid' : ''}`, 'aria-invalid': !!error,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value)
  };
  return (
    <div className="field">
      <label htmlFor={id} className="form-label field__label">{label}</label>
      {multiline ? <textarea rows={3} {...common} /> : <input type={type} list={list} step={step} {...common} />}
      {error && <div className="invalid-feedback">{t(error)}</div>}
    </div>
  );
}
