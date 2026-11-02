import ProductsView from '@/components/products/ProductsView';
import { api } from '@/api';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const data = await Promise.all([api.products(), api.productTypes(), api.productSpecifications()]).catch(() => null);
  return <ProductsView items={data?.[0] ?? []} types={data?.[1] ?? []} specifications={data?.[2] ?? []} failed={data === null} />;
}
