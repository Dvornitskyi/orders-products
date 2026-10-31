import type { MessageKey } from '@/i18n/dictionaries';

// Ошибки формы: для каждого поля — ключ перевода (не готовый текст), поэтому язык можно менять на лету.
export type Errors<T> = Partial<Record<keyof T, MessageKey>>;

// Во время редактирования убираем ошибки только у уже исправленных полей.
// Новые ошибки в ещё не тронутых полях не появляются — они появятся при нажатии «Сохранить».
export function keepUnfixed<T>(previous: Errors<T>, fresh: Errors<T>): Errors<T> {
  const out: Errors<T> = {};
  for (const k of Object.keys(previous) as (keyof T)[]) if (fresh[k]) out[k] = fresh[k];
  return out;
}
