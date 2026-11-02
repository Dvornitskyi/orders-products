'use client';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useDeferredValue, useMemo, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { formatLong, formatMonthOfYear } from '@/utils/format';
import { matchesOrder } from '@/utils/search';
import { orderTotals } from '@/utils/totals';
import type { ErrorPayload, Order, Product } from '@/types';
import { useFailure } from '@/hooks/useFailure';
import { useHydrate } from '@/hooks/useHydrate';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { deleteOrder, deleteProduct, setOrders } from '@/store/ordersSlice';
import Money from '@/components/ui/Money';
import SortControl from '@/components/ui/SortControl';
import { sortOrders, type Direction, type OrderSortKey } from '@/utils/sort';
import ProductLine from '@/components/orders/ProductLine';

// Lazy Loading: код форм и попапа загружается только тогда, когда пользователь их открыл
const OrderForm = dynamic(() => import('@/components/orders/OrderForm'));
const ProductForm = dynamic(() => import('@/components/orders/ProductForm'));
const ConfirmModal = dynamic(() => import('@/components/ui/ConfirmModal'));

type Result = { meta: { requestStatus: string }; payload?: unknown };
interface Confirm { title: string; products: Product[]; run: () => Promise<Result> }

export default function OrdersView({ initial, failed }: { initial: Order[]; failed: boolean }) {
  useHydrate(() => setOrders(initial));
  const { t, months, productsWord, typeLabel } = useI18n();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const fail = useFailure();
  const orders = useAppSelector((s) => s.orders.items);
  const query = useAppSelector((s) => s.search.query);
  const deferredQuery = useDeferredValue(query); // ввод в поиск не тормозит, список фильтруется с низким приоритетом
  const [sortKey, setSortKey] = useState<OrderSortKey>('none');
  const [sortDir, setSortDir] = useState<Direction>('desc');
  // сначала поиск из шапки, потом сортировка
  const visible = useMemo(
    () => sortOrders(orders.filter((o) => matchesOrder(o, deferredQuery, typeLabel)), sortKey, sortDir),
    [orders, deferredQuery, typeLabel, sortKey, sortDir]
  );
  const token = useAppSelector((s) => s.auth.token);

  const [openId, setOpenId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const open = orders.find((o) => o.id === openId) ?? null; // после удаления прихода панель закрывается сама
  const types = useMemo(() => [...new Set(orders.flatMap((o) => o.products.map((p) => p.type)))], [orders]);
  // Изменения разрешены только с токеном. Если пользователь не вошёл — ведём на страницу входа.
  const guard = (fn: () => void) => () => (token ? fn() : router.push('/login'));

  const execute = async (): Promise<string | null> => {
    const res = await confirm!.run();
    if (res.meta.requestStatus === 'fulfilled') { setConfirm(null); return null; }
    return fail(res.payload as ErrorPayload | undefined);
  };

  return (
    <section>
      <div className="page-head page-head--wrap">
        <button type="button" className="round-btn" aria-label={t('addOrder')} title={t('addOrder')} onClick={guard(() => setCreating(true))}>+</button>
        <h1 className="page-title">{t('ordersTitle')} / {visible.length}</h1>
        <SortControl value={sortKey} direction={sortDir} onChange={setSortKey} onDirection={setSortDir}
          options={[{ value: 'none', label: t('sortNone') }, { value: 'date', label: t('sortDate') },
            { value: 'count', label: t('sortCount') }, { value: 'total', label: t('sortTotal') }]} />
      </div>

      {failed && <div className="alert alert-warning">{t('loadFailed')}</div>}
      {!failed && visible.length === 0 && <p className="text-muted">{query.trim() ? t('nothingFound') : t('empty')}</p>}

      <div className={`orders ${open ? 'orders--split' : ''}`}>
        <ul className="orders__list">
          {visible.map((o) => {
            const compact = !!open;
            return (
              <li key={o.id} className={`order-row ${o.id === openId ? 'order-row--active' : ''} ${compact ? 'order-row--compact' : ''}`}>
                <button type="button" className="order-row__main" onClick={() => setOpenId(o.id)} aria-expanded={o.id === openId}>
                  {!compact && <span className="order-row__title">{o.title}</span>}
                  <span className="order-row__icon" aria-hidden="true">☰</span>
                  <span className="order-row__count"><b>{o.products.length}</b><small>{productsWord(o.products.length)}</small></span>
                  <span className="order-row__date"><small>{formatMonthOfYear(o.date)}</small>{formatLong(o.date, months)}</span>
                  {!compact && <span className="order-row__sum"><Money totals={orderTotals(o.products)} /></span>}
                </button>
                {!compact && (
                  <button type="button" className="icon-btn" aria-label={t('delete')}
                    onClick={guard(() => setConfirm({ title: t('deleteOrderQ'), products: o.products, run: () => dispatch(deleteOrder(o.id)) }))}>🗑</button>
                )}
              </li>
            );
          })}
        </ul>

        {open && (
          <aside className="order-details">
            <button type="button" className="round-btn round-btn--ghost order-details__close" aria-label={t('close')} onClick={() => setOpenId(null)}>×</button>
            <h2 className="order-details__title">{open.title}</h2>
            <button type="button" className="link-btn" onClick={guard(() => setAddingProduct(true))}>
              <span className="link-btn__plus">+</span> {t('addProduct')}
            </button>
            <div className="order-details__list">
              {open.products.map((p) => (
                <ProductLine key={p.id} product={p}
                  onDelete={guard(() => setConfirm({ title: t('deleteProductQ'), products: [p], run: () => dispatch(deleteProduct(p.id)) }))} />
              ))}
            </div>
          </aside>
        )}
      </div>

      {creating && <OrderForm onClose={() => setCreating(false)} />}
      {addingProduct && open && <ProductForm orderId={open.id} types={types} onClose={() => setAddingProduct(false)} />}
      {confirm && <ConfirmModal title={confirm.title} products={confirm.products} onCancel={() => setConfirm(null)} onConfirm={execute} />}
    </section>
  );
}
