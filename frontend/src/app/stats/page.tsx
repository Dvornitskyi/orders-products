import StatsLoader from '@/components/stats/StatsLoader';
import { api } from '@/api';

export const dynamic = 'force-dynamic';

export default async function StatsPage() {
  const orders = await api.orders().catch(() => null);
  return <StatsLoader orders={orders ?? []} failed={orders === null} />;
}
