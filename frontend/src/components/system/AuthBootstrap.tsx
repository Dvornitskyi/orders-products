'use client';
import { useEffect } from 'react';
import { isExpired } from '@/utils/jwt';
import { clearSession, loadSession } from '@/utils/storage';
import { sessionRestored } from '@/store/authSlice';
import { useAppDispatch } from '@/store/hooks';

// Невидимый компонент: при загрузке страницы читает токен из localStorage и кладёт его в Redux
export default function AuthBootstrap() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const s = loadSession();
    if (s && isExpired(s.token)) { clearSession(); dispatch(sessionRestored(null)); }
    else dispatch(sessionRestored(s));
  }, [dispatch]);
  return null;
}
