'use client';
import { memo } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { formatLong, formatMonthOfYear, formatNumeric } from '@/utils/format';
import type { Product } from '@/types';
import Money from '@/components/ui/Money';
import ProductThumb from '@/components/ui/ProductThumb';

// Строка списка продуктов. React.memo: при вводе в поиск или обновлении соседних строк
// перерисовываются только те строки, у которых изменился сам продукт.
function ProductRow({ p }: { p: Product }) {
  const { t, months, typeLabel } = useI18n();
  return (
    <li className="product-row">
      <span className={`dot ${p.isNew ? 'dot--free' : ''}`} />
      <ProductThumb photo={p.photo} />
      <div className="product-row__name"><div className="product-line__title">{p.title}</div><small className="product-line__sn">SN-{p.serialNumber}</small></div>
      <div className="product-row__type">{typeLabel(p.type)}</div>
      <div className="product-row__guarantee">
        <div><small>{t('guaranteeFrom')}</small> {formatNumeric(p.guarantee.start)} <small className="product-row__alt">{formatLong(p.guarantee.start, months)}</small></div>
        <div><small>{t('guaranteeTo')}</small> {formatNumeric(p.guarantee.end)} <small className="product-row__alt">{formatLong(p.guarantee.end, months)}</small></div>
      </div>
      <div>{p.isNew ? t('new') : t('used')}</div>
      <Money totals={p.price.map((x) => ({ symbol: x.symbol, value: x.value, isDefault: x.isDefault === 1 }))
        .sort((a, b) => Number(a.isDefault) - Number(b.isDefault))} />
      <div className="product-row__order">{p.orderTitle}</div>
      <div className="order-row__date"><small>{formatMonthOfYear(p.date)}</small>{formatLong(p.date, months)}</div>
    </li>
  );
}

export default memo(ProductRow);
