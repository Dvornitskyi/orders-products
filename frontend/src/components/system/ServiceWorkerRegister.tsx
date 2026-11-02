'use client';
import { useEffect } from 'react';

// Регистрирует service worker. Только в production: в режиме разработки кэш мешал бы видеть изменения.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => { /* PWA — улучшение, а не обязательная часть */ });
  }, []);
  return null;
}
