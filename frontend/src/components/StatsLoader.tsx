'use client';
import dynamic from 'next/dynamic';
import { useI18n } from '@/i18n/I18nProvider';
import type { Order } from '@/types';

// Lazy Loading: библиотека графиков (recharts) тяжёлая — загружаем её только на этой странице и только в браузере
const StatsView = dynamic(() => import('./StatsView'), { ssr: false, loading: () => <Loading /> });
function Loading() { const { t } = useI18n(); return <p className="text-muted">{t('loading')}</p>; }

export default function StatsLoader({ orders, failed }: { orders: Order[]; failed: boolean }) {
  const { t } = useI18n();
  return (
    <section>
      <h1 className="page-title">{t('statsTitle')}</h1>
      {failed ? <div className="alert alert-warning">{t('loadFailed')}</div> : <StatsView orders={orders} />}
    </section>
  );
}
