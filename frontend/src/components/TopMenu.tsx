'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useI18n } from '@/i18n/I18nProvider';
import { pad } from '@/utils/format';
import { logout } from '@/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setQuery } from '@/store/searchSlice';
import LanguageSwitcher from './LanguageSwitcher';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

export default function TopMenu() {
  const { t, months, weekdays } = useI18n();
  const dispatch = useAppDispatch();
  const loginName = useAppSelector((s) => s.auth.login);
  const query = useAppSelector((s) => s.search.query);
  const [now, setNow] = useState<Date | null>(null); // null на сервере → нет расхождения при гидратации
  const [sessions, setSessions] = useState<number | null>(null);

  // Часы в реальном времени
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // WebSocket: сервер рассылает количество подключённых вкладок каждый раз, когда кто-то открывает/закрывает вкладку
  useEffect(() => {
    if (SOCKET_URL === 'off') return; // этап 1 (mock API): WebSocket-сервера ещё нет
    const socket = io(SOCKET_URL);
    socket.on('sessions', (n: number) => setSessions(n));
    return () => { socket.disconnect(); };
  }, []);

  return (
    <header className="top-menu">
      <Link href="/orders" className="top-menu__logo">
        <svg viewBox="0 0 24 28" width="26" height="30" aria-hidden="true"><path d="M12 1 2 5v8c0 7 4 12 10 14 6-2 10-7 10-14V5z" fill="#7cb342" /><circle cx="12" cy="11" r="3" fill="#fff" /><path d="M6 20c1-4 11-4 12 0" fill="#fff" /></svg>
        INVENTORY
      </Link>
      <input type="search" className="top-menu__search form-control" value={query} placeholder={t('searchPlaceholder')}
        aria-label={t('searchPlaceholder')} onChange={(e) => dispatch(setQuery(e.target.value))} />
      <div className="top-menu__right">
        <LanguageSwitcher />
        {loginName ? (
          <button type="button" className="top-menu__auth" onClick={() => dispatch(logout())}>{loginName} · {t('logout')}</button>
        ) : (
          <Link href="/login" className="top-menu__auth">{t('login')}</Link>
        )}
        <span className="top-menu__sessions" title={t('sessions')}>
          <span className="top-menu__dot" aria-hidden="true" />{sessions ?? '–'}
        </span>
        <div className="top-menu__date" suppressHydrationWarning>
          {now && (<>
            <div>{weekdays[now.getDay()]}</div>
            <div>
              <small>{pad(now.getDate())} {months[now.getMonth()]}, {now.getFullYear()}</small>
              <b className="top-menu__time">{pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}</b>
            </div>
          </>)}
        </div>
      </div>
    </header>
  );
}
