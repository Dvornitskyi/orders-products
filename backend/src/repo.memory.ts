import bcrypt from 'bcryptjs';
import type { NewOrder, NewProduct, OrderDto, Price, ProductDto, ProductFilters, Repo, UserRecord } from './types';

// Хранилище в памяти: без базы и без Docker. Нужно для тестов и для запуска фронтенда отдельно (npm run dev:mock).
// Данные живут, пока работает процесс. Ведёт себя так же, как MySQL-версия, включая каскадное удаление.
const stamp = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
const prices = (usd: number, uah: number): Price[] => [{ value: usd, symbol: 'USD', isDefault: 0 }, { value: uah, symbol: 'UAH', isDefault: 1 }];

interface OrderRow { id: number; title: string; description: string; lat: number | null; lng: number | null; date: string }
type ProductRow = Omit<ProductDto, 'orderTitle'>;

export function createMemoryRepo(opts: { seed?: boolean; adminLogin?: string; adminPassword?: string } = {}): Repo {
  const { seed = true, adminLogin = process.env.ADMIN_LOGIN ?? 'admin', adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123' } = opts;
  const guarantee = { start: '2017-04-06 12:00:00', end: '2025-08-06 12:00:00' };
  const product = (id: number, serialNumber: number, isNew: number, photo: string, title: string, type: string, order: number, usd: number, uah: number): ProductRow =>
    ({ id, serialNumber, isNew, photo, title, type, specification: `Specification ${id}`, guarantee: { ...guarantee }, price: prices(usd, uah), order, date: '2017-06-29 12:09:33' });

  let orders: OrderRow[] = seed ? [
    { id: 1, title: 'Длинное предлинное длиннючее название прихода', description: 'Основная поставка мониторов', lat: 50.4501, lng: 30.5234, date: '2017-04-06 12:09:33' },
    { id: 2, title: 'Длинное название прихода', description: 'Периферия', lat: 49.8397, lng: 24.0297, date: '2017-09-06 12:09:33' },
    { id: 3, title: 'Длинное предлинное название прихода', description: 'Мыши и мониторы', lat: 46.4825, lng: 30.7233, date: '2017-06-06 12:09:33' }
  ] : [];
  let products: ProductRow[] = seed ? [
    product(1, 12345678, 1, 'monitor.svg', 'Gigabyte Technology X58-USB3', 'Monitors', 1, 100, 2600),
    product(2, 12345679, 1, 'monitor.svg', 'Dell U2415', 'Monitors', 1, 250, 6500),
    product(3, 12345680, 0, 'keyboard.svg', 'Logitech MX Keys', 'Keyboards', 2, 90, 2340),
    product(4, 12345681, 1, 'mouse.svg', 'Razer DeathAdder', 'Mice', 3, 60, 1560),
    product(5, 12345682, 1, 'monitor.svg', 'Samsung Odyssey G5', 'Monitors', 3, 320, 8320),
    product(6, 12345683, 0, 'monitor.svg', 'HP 24mh', 'Monitors', 2, 140, 3640)
  ] : [];
  let nextOrder = orders.length + 1, nextProduct = products.length + 1;
  const users: (UserRecord & { createdAt: string })[] = [];

  const titleOf = (id: number) => orders.find((o) => o.id === id)?.title ?? '';
  const withTitle = (p: ProductRow): ProductDto => ({ ...p, orderTitle: titleOf(p.order) });

  return {
    async init() {
      users.push({ id: 1, login: adminLogin, passwordHash: bcrypt.hashSync(adminPassword, 8), createdAt: '2017-03-12 17:20:00' });
    },
    async getOrders(): Promise<OrderDto[]> {
      return orders.map((o) => ({ ...o, products: products.filter((p) => p.order === o.id).map(withTitle) }));
    },
    async createOrder(b: NewOrder) {
      orders.push({ id: nextOrder, title: b.title.trim(), description: (b.description ?? '').trim(), lat: b.lat ?? null, lng: b.lng ?? null, date: stamp() });
      return nextOrder++;
    },
    async deleteOrder(id) {
      if (!orders.some((o) => o.id === id)) return false;
      orders = orders.filter((o) => o.id !== id);
      products = products.filter((p) => p.order !== id); // каскад, как ON DELETE CASCADE
      return true;
    },
    async orderExists(id) { return orders.some((o) => o.id === id); },
    async getProducts({ type, specification }: ProductFilters = {}) {
      return products.filter((p) => (!type || p.type === type) && (!specification || p.specification === specification)).map(withTitle);
    },
    async getTypes() { return [...new Set(products.map((p) => p.type))].sort(); },
    async getSpecifications() { return [...new Set(products.map((p) => p.specification).filter(Boolean))].sort(); },
    async createProduct(b: NewProduct) {
      products.push({
        id: nextProduct, serialNumber: Number(b.serialNumber), isNew: b.isNew ? 1 : 0, photo: 'monitor.svg', title: b.title.trim(), type: b.type.trim(),
        specification: (b.specification ?? '').trim(), guarantee: { start: b.guaranteeStart, end: b.guaranteeEnd },
        price: prices(Number(b.priceUsd), Number(b.priceUah)), order: Number(b.orderId), date: stamp()
      });
      return nextProduct++;
    },
    async deleteProduct(id) {
      const before = products.length;
      products = products.filter((p) => p.id !== id);
      return products.length < before;
    },
    async getUsers() { return users.map(({ id, login, createdAt }) => ({ id, login, createdAt })); },
    async findUser(login) { return users.find((u) => u.login === login); }
  };
}
