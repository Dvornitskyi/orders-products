'use client';
import { useDeferredValue, useMemo, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { matchesProduct } from '@/utils/search';
import type { Product } from '@/types';
import { useHydrate } from '@/hooks/useHydrate';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadProducts, setProducts } from '@/store/productsSlice';
import ProductRow from '@/components/products/ProductRow';
import SortControl from '@/components/ui/SortControl';
import { sortProducts, type Direction, type ProductSortKey } from '@/utils/sort';

export default function ProductsView({ items: initial, types, specifications, failed }: { items: Product[]; types: string[]; specifications: string[]; failed: boolean }) {
  useHydrate(() => setProducts({ items: initial, types, specifications }));
  const { t, typeLabel } = useI18n();
  const dispatch = useAppDispatch();
  const { items, types: allTypes, specifications: allSpecs, type, specification, loading, failed: reloadFailed } = useAppSelector((s) => s.products);
  const query = useAppSelector((s) => s.search.query);
  // Фильтры «Тип» и «Спецификация» идут на сервер (REST), а поиск из шапки применяется к уже загруженному списку
  // useDeferredValue: поле поиска отвечает сразу, а тяжёлая фильтрация списка идёт «с низким приоритетом»;
  // useMemo: фильтр пересчитывается только при смене списка или запроса
  const deferredQuery = useDeferredValue(query);
  const [sortKey, setSortKey] = useState<ProductSortKey>('none');
  const [sortDir, setSortDir] = useState<Direction>('desc');
  // порядок: фильтры на сервере → поиск из шапки → сортировка
  const list = useMemo(
    () => sortProducts(items.filter((p) => matchesProduct(p, deferredQuery, typeLabel)), sortKey, sortDir),
    [items, deferredQuery, typeLabel, sortKey, sortDir]
  );

  return (
    <section>
      <div className="page-head page-head--wrap">
        <h1 className="page-title">{t('productsTitle')} / {list.length}</h1>
        <label className="filter">
          <span className="filter__label">{t('filterType')}</span>
          <select className="form-select filter__select" value={type} onChange={(e) => dispatch(loadProducts({ type: e.target.value, specification }))}>
            <option value="">{t('allTypes')}</option>
            {allTypes.map((x) => <option key={x} value={x}>{typeLabel(x)}</option>)}
          </select>
        </label>
        <label className="filter">
          <span className="filter__label">{t('filterSpec')}</span>
          <select className="form-select filter__select" value={specification} onChange={(e) => dispatch(loadProducts({ type, specification: e.target.value }))}>
            <option value="">{t('allSpecs')}</option>
            {allSpecs.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
        <SortControl value={sortKey} direction={sortDir} onChange={setSortKey} onDirection={setSortDir}
          options={[{ value: 'none', label: t('sortNone') }, { value: 'title', label: t('sortTitle') },
            { value: 'condition', label: t('sortCondition') }, { value: 'price', label: t('sortPrice') },
            { value: 'date', label: t('sortDate') }, { value: 'guarantee', label: t('sortGuarantee') }]} />
      </div>

      {(failed || reloadFailed) && <div className="alert alert-warning">{t('loadFailed')}</div>}
      {!failed && !loading && list.length === 0 && <p className="text-muted">{query.trim() ? t('nothingFound') : t('empty')}</p>}

      <div className="products" aria-busy={loading}>
        <ul className={`products__list ${loading ? 'products__list--loading' : ''}`}>
          {list.map((p) => <ProductRow key={p.id} p={p} />)}
        </ul>
      </div>
    </section>
  );
}
