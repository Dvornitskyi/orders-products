'use client';
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/i18n/I18nProvider';

export default function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useI18n();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  // Портал выносит попап прямо в <body>: fixed-позиционирование не зависит от transform/overflow родительских блоков
  return createPortal(
    <div className="popup" onMouseDown={onClose}>
      <div className="popup__box" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" className="popup__close" aria-label={t('close')} onClick={onClose}>×</button>
        <h2 className="popup__title">{title}</h2>
        {children}
      </div>
    </div>,
    document.body
  );
}
