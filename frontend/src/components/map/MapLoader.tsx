'use client';
import dynamic from 'next/dynamic';
import { useI18n } from '@/i18n/I18nProvider';
import type { Order } from '@/types';
import { useHydrate } from '@/hooks/useHydrate';
import { useAppSelector } from '@/store/hooks';
import { setOrders } from '@/store/ordersSlice';

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => <Loading />,
});
function Loading() {
  const { t } = useI18n();
  return <p className='text-muted'>{t('loading')}</p>;
}

export default function MapLoader({
  orders: initial,
  failed,
}: {
  orders: Order[];
  failed: boolean;
}) {
  useHydrate(() => setOrders(initial));
  const { t } = useI18n();
  const orders = useAppSelector((s) => s.orders.items);
  return (
    <section>
      <h1 className='page-title'>{t('mapTitle')}</h1>
      {failed ? (
        <div className='alert alert-warning'>{t('loadFailed')}</div>
      ) : (
        <MapView orders={orders} />
      )}
    </section>
  );
}
