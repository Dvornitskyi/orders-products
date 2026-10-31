'use client';
import { useI18n } from '@/i18n/I18nProvider';
import { formatLong, formatMonthOfYear, formatNumeric } from '@/utils/format';
import { matchesProduct } from '@/utils/search';
import type { Product } from '@/types';
import { useHydrate } from '@/hooks/useHydrate';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadProducts, setProducts } from '@/store/productsSlice';
import Money from './Money';
import ProductThumb from './ProductThumb';

export default function ProductsView({ items: initial, types, specifications, failed }: { items: Product[]; types: string[]; specifications: string[]; failed: boolean }) {
  useHydrate(() => setProducts({ items: initial, types, specifications }));
  const { t, months } = useI18n();
  const dispatch = useAppDispatch();
  const { items, types: allTypes, specifications: allSpecs, type, specification, loading, failed: reloadFailed } = useAppSelector((s) => s.products);
  const query = useAppSelector((s) => s.search.query);
  // Фильтры «Тип» и «Спецификация» идут на сервер (REST), а поиск из шапки применяется к уже загруженному списку
  const list = items.filter((p) => matchesProduct(p, query));

  return (
    <section>
      <div className="page-head page-head--wrap">
        <h1 className="page-title">{t('productsTitle')} / {list.length}</h1>
        <label className="filter">
          <span className="filter__label">{t('filterType')}</span>
          <select className="form-select filter__select" value={type} onChange={(e) => dispatch(loadProducts({ type: e.target.value, specification }))}>
            <option value="">{t('allTypes')}</option>
            {allTypes.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
        <label className="filter">
          <span className="filter__label">{t('filterSpec')}</span>
          <select className="form-select filter__select" value={specification} onChange={(e) => dispatch(loadProducts({ type, specification: e.target.value }))}>
            <option value="">{t('allSpecs')}</option>
            {allSpecs.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
      </div>

      {(failed || reloadFailed) && <div className="alert alert-warning">{t('loadFailed')}</div>}
      {!failed && !loading && list.length === 0 && <p className="text-muted">{query.trim() ? t('nothingFound') : t('empty')}</p>}

      <div className="products" aria-busy={loading}>
        <ul className={`products__list ${loading ? 'products__list--loading' : ''}`}>
          {list.map((p) => (
            <li key={p.id} className="product-row">
              <span className={`dot ${p.isNew ? 'dot--free' : ''}`} />
              <ProductThumb photo={p.photo} />
              <div className="product-row__name"><div className="product-line__title">{p.title}</div><small className="product-line__sn">SN-{p.serialNumber}</small></div>
              <div className="product-row__type">{p.type}</div>
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
          ))}
        </ul>
      </div>
    </section>
  );
}
