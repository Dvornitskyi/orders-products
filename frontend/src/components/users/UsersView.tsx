'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { api } from '@/api';
import { toPayload } from '@/api/errors';
import { formatLong } from '@/utils/format';
import type { User } from '@/types';
import { useFailure } from '@/hooks/useFailure';
import { useAppSelector } from '@/store/hooks';

// Список пользователей доступен только с токеном, а токен есть только в браузере (localStorage) —
// поэтому, в отличие от Orders/Products, данные здесь грузятся на клиенте, а не во время SSR.
export default function UsersView() {
  const { t, months } = useI18n();
  const fail = useFailure();
  const { token, ready } = useAppSelector((s) => s.auth);
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready || !token) return;
    api.users(token).then(setUsers).catch((e) => setError(fail(toPayload(e))));
  }, [ready, token, fail]);

  return (
    <section>
      <div className="page-head"><h1 className="page-title">{t('usersTitle')}{users ? ` / ${users.length}` : ''}</h1></div>
      {ready && !token && (
        <p className="text-muted">{t('usersLoginRequired')} — <Link href="/login">{t('login')}</Link></p>
      )}
      {error && <div className="alert alert-warning">{error}</div>}
      {token && !users && !error && <p className="text-muted">{t('loading')}</p>}
      {users && (
        <ul className="users">
          {users.map((u) => (
            <li key={u.id} className="users__row">
              <span className="users__avatar" aria-hidden="true">{u.login.slice(0, 1).toUpperCase()}</span>
              <span className="users__login">{u.login}</span>
              <span className="users__date"><small>{t('usersCreated')}</small>{formatLong(u.createdAt, months)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
