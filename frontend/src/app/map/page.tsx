import MapLoader from '@/components/map/MapLoader';
import { api } from '@/api';

export const dynamic = 'force-dynamic';

export default async function MapPage() {
  const orders = await api.orders().catch(() => null);
  return <MapLoader orders={orders ?? []} failed={orders === null} />;
}
