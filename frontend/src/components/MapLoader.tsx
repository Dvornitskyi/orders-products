'use client';
import dynamic from 'next/dynamic';
import { useI18n } from '@/i18n/I18nProvider';
import type { Order } from '@/types';

// Leaflet работает с window, поэтому на сервере не рендерится (ssr: false) и загружается отдельным чанком
const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <Loading /> });
function Loading() { const { t } = useI18n(); return <p className="text-muted">{t('loading')}</p>; }

export default function MapLoader({ orders, failed }: { orders: Order[]; failed: boolean }) {
  const { t } = useI18n();
  return (
    <section>
      <h1 className="page-title">{t('mapTitle')}</h1>
      {failed ? <div className="alert alert-warning">{t('loadFailed')}</div> : <MapView orders={orders} />}
    </section>
  );
}
