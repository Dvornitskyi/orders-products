'use client';
import { useState, type FormEvent } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { keepUnfixed, toNumber, validateOrder, type Errors, type OrderValues } from '@/validation';
import { useFailure } from '@/hooks/useFailure';
import { useAppDispatch } from '@/store/hooks';
import { createOrder } from '@/store/ordersSlice';
import Modal from '@/components/ui/Modal';
import TextField from '@/components/ui/TextField';

export default function OrderForm({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const fail = useFailure();
  const [v, setV] = useState<OrderValues>({ title: '', description: '', lat: '', lng: '' });
  const [errors, setErrors] = useState<Errors<OrderValues>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof OrderValues) => (val: string) => {
    const next = { ...v, [k]: val };
    setV(next);
    setErrors((prev) => keepUnfixed(prev, validateOrder(next)));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validateOrder(v);
    setErrors(errs);
    if (Object.keys(errs).length) return;           // валидация на клиенте
    setBusy(true);
    const has = v.lat.trim() !== '';
    const res = await dispatch(createOrder({
      title: v.title.trim(), description: v.description.trim(),
      lat: has ? toNumber(v.lat) : null, lng: has ? toNumber(v.lng) : null
    }));
    setBusy(false);
    if (createOrder.fulfilled.match(res)) onClose();
    else setServerError(fail(res.payload));         // и ещё раз проверяет бэкенд
  };

  return (
    <Modal title={t('addOrder')} onClose={onClose}>
      <form className="popup__form" onSubmit={submit} noValidate>
        <TextField id="o-title" label={t('fieldTitle')} value={v.title} onChange={set('title')} error={errors.title} />
        <TextField id="o-desc" label={t('fieldDescription')} value={v.description} onChange={set('description')} error={errors.description} multiline />
        <div className="field-row">
          <TextField id="o-lat" label={t('fieldLat')} value={v.lat} onChange={set('lat')} error={errors.lat} />
          <TextField id="o-lng" label={t('fieldLng')} value={v.lng} onChange={set('lng')} error={errors.lng} />
        </div>
        {serverError && <div className="alert alert-danger" role="alert">{serverError}</div>}
        <div className="popup__actions">
          <button type="button" className="btn btn-link" onClick={onClose}>{t('cancel')}</button>
          <button type="submit" className="btn btn-success" disabled={busy}>{t('save')}</button>
        </div>
      </form>
    </Modal>
  );
}
