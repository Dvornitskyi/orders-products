'use client';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { logout } from '@/store/authSlice';
import { useAppDispatch } from '@/store/hooks';
import type { ErrorPayload } from '@/types';

// Превращает ошибку API в текст для пользователя. 401 → токен недействителен: выходим и ведём на /login.
export function useFailure() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { t } = useI18n();
  return useCallback((p?: ErrorPayload): string => {
    if (p?.status === 401) { dispatch(logout()); router.push('/login'); return t('sessionExpired'); }
    return p && p.status !== 0 && p.errors.length ? p.errors.join('; ') : t('unknownError');
  }, [dispatch, router, t]);
}
