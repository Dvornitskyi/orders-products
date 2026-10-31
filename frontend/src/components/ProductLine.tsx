'use client';
import { useI18n } from '@/i18n/I18nProvider';
import type { Product } from '@/types';
import ProductThumb from './ProductThumb';

// Строка продукта (в панели прихода и в попапе удаления)
export default function ProductLine({ product, onDelete }: { product: Product; onDelete?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="product-line">
      <span className={`dot ${product.isNew ? 'dot--free' : ''}`} />
      <ProductThumb photo={product.photo} />
      <div className="product-line__name">
        <div className="product-line__title">{product.title}</div>
        <small className="product-line__sn">SN-{product.serialNumber}</small>
      </div>
      <span className={`product-line__state ${product.isNew ? 'product-line__state--new' : ''}`}>{product.isNew ? t('new') : t('used')}</span>
      {onDelete && <button type="button" className="icon-btn" onClick={onDelete} aria-label={t('delete')}>🗑</button>}
    </div>
  );
}
