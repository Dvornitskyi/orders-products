import { useRef } from 'react';
import type { UnknownAction } from '@reduxjs/toolkit';
import { useAppStore } from '@/store/hooks';

// SSR: страница (серверный компонент) загрузила данные и передала их в клиентский компонент.
// Кладём их в Redux ДО первого рендера — тогда и сервер, и браузер рисуют одинаковую разметку.
export function useHydrate(makeAction: () => UnknownAction) {
  const store = useAppStore();
  const done = useRef(false);
  if (!done.current) { done.current = true; store.dispatch(makeAction()); }
}
