'use client';
import { useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import type { Product } from '@/types';
import Modal from '@/components/ui/Modal';
import ProductLine from '@/components/orders/ProductLine';

interface Props {
  title: string; products: Product[]; onCancel: () => void;
  onConfirm: () => Promise<string | null>; // возвращает текст ошибки или null, если всё хорошо
}
export default function ConfirmModal({ title, products, onCancel, onConfirm }: Props) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async () => { setBusy(true); setError(await onConfirm()); setBusy(false); };
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="popup__list">{products.map((p) => <ProductLine key={p.id} product={p} />)}</div>
      {error && <div className="alert alert-danger m-3 mb-0" role="alert">{error}</div>}
      <div className="popup__footer popup__footer--accent">
        <button type="button" className="popup__cancel" onClick={onCancel}>{t('cancel')}</button>
        <button type="button" className="popup__danger" onClick={run} disabled={busy}>🗑 {t('delete')}</button>
      </div>
    </Modal>
  );
}
