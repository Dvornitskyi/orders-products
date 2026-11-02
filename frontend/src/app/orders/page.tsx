import OrdersView from '@/components/orders/OrdersView';
import { api } from '@/api';

export const dynamic = 'force-dynamic'; // данные всегда свежие, страница рендерится на сервере при каждом запросе

export default async function OrdersPage() {
  const orders = await api.orders().catch(() => null);
  return <OrdersView initial={orders ?? []} failed={orders === null} />;
}
