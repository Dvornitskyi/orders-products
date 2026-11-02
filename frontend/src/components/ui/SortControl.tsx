'use client';
import { useI18n } from '@/i18n/I18nProvider';
import type { Direction } from '@/utils/sort';

interface Props<K extends string> {
  value: K;
  direction: Direction;
  options: { value: K; label: string }[];
  onChange: (key: K) => void;
  onDirection: (d: Direction) => void;
}

export default function SortControl<K extends string>({
  value,
  direction,
  options,
  onChange,
  onDirection,
}: Props<K>) {
  const { t } = useI18n();
  const asc = direction === 'asc';
  return (
    <label className='filter'>
      <span className='filter__label'>{t('sortBy')}</span>
      <select
        className='form-select filter__select'
        value={value}
        onChange={(e) => onChange(e.target.value as K)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type='button'
        className='btn btn-outline-secondary btn-sm'
        disabled={value === 'none'}
        aria-label={t(asc ? 'sortAsc' : 'sortDesc')}
        title={t(asc ? 'sortAsc' : 'sortDesc')}
        onClick={() => onDirection(asc ? 'desc' : 'asc')}>
        {asc ? '↑' : '↓'}
      </button>
    </label>
  );
}
