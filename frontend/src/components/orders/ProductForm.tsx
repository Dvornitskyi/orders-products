'use client';
import { useState, type FormEvent } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { keepUnfixed, toNumber, validateProduct, type Errors, type ProductValues } from '@/validation';
import { useFailure } from '@/hooks/useFailure';
import { useAppDispatch } from '@/store/hooks';
import { createProduct } from '@/store/ordersSlice';
import Modal from '@/components/ui/Modal';
import TextField from '@/components/ui/TextField';

export default function ProductForm({ orderId, types, onClose }: { orderId: number; types: string[]; onClose: () => void }) {
  const { t, typeLabel } = useI18n();
  const dispatch = useAppDispatch();
  const fail = useFailure();
  const [v, setV] = useState<ProductValues>({
    title: '', serialNumber: '', type: '', specification: '', priceUsd: '', priceUah: '', guaranteeStart: '', guaranteeEnd: '', isNew: true
  });
  const [errors, setErrors] = useState<Errors<ProductValues>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof ProductValues) => (val: string) => {
    const next = { ...v, [k]: val };
    setV(next);
    setErrors((prev) => keepUnfixed(prev, validateProduct(next)));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validateProduct(v);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    const res = await dispatch(createProduct({
      title: v.title.trim(), serialNumber: toNumber(v.serialNumber), type: v.type.trim(), specification: v.specification.trim(),
      isNew: v.isNew, orderId, priceUsd: toNumber(v.priceUsd), priceUah: toNumber(v.priceUah),
      guaranteeStart: v.guaranteeStart, guaranteeEnd: v.guaranteeEnd
    }));
    setBusy(false);
    if (createProduct.fulfilled.match(res)) onClose();
    else setServerError(fail(res.payload));
  };

  return (
    <Modal title={t('addProduct')} onClose={onClose}>
      <form className="popup__form" onSubmit={submit} noValidate>
        <TextField id="p-title" label={t('fieldTitle')} value={v.title} onChange={set('title')} error={errors.title} />
        <div className="field-row">
          <TextField id="p-sn" label={t('fieldSerial')} value={v.serialNumber} onChange={set('serialNumber')} error={errors.serialNumber} />
          <TextField id="p-type" label={t('fieldType')} value={v.type} onChange={set('type')} error={errors.type} list="product-types" />
          <datalist id="product-types">{types.map((x) => <option key={x} value={x} label={typeLabel(x)} />)}</datalist>
        </div>
        <TextField id="p-spec" label={t('fieldSpec')} value={v.specification} onChange={set('specification')} />
        <div className="field-row">
          <TextField id="p-usd" label={t('fieldPriceUsd')} value={v.priceUsd} onChange={set('priceUsd')} error={errors.priceUsd} />
          <TextField id="p-uah" label={t('fieldPriceUah')} value={v.priceUah} onChange={set('priceUah')} error={errors.priceUah} />
        </div>
        <div className="field-row">
          <TextField id="p-gs" label={t('fieldGuaranteeStart')} type="date" value={v.guaranteeStart} onChange={set('guaranteeStart')} error={errors.guaranteeStart} />
          <TextField id="p-ge" label={t('fieldGuaranteeEnd')} type="date" value={v.guaranteeEnd} onChange={set('guaranteeEnd')} error={errors.guaranteeEnd} />
        </div>
        <div className="form-check mb-3">
          <input id="p-new" type="checkbox" className="form-check-input" checked={v.isNew} onChange={(e) => setV((p) => ({ ...p, isNew: e.target.checked }))} />
          <label htmlFor="p-new" className="form-check-label">{t('fieldIsNew')}</label>
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
