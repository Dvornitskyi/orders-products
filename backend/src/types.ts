// Формат данных совпадает с app.js из тестового задания. Это «контракт» между слоями:
// REST, GraphQL, тесты и обе реализации хранилища (MySQL и память) говорят на одном языке.
export interface Price { value: number; symbol: string; isDefault: number }
export interface ProductDto {
  id: number; serialNumber: number; isNew: number; photo: string; title: string; type: string; specification: string;
  guarantee: { start: string; end: string }; price: Price[]; order: number; orderTitle: string; date: string;
}
export interface OrderDto {
  id: number; title: string; description: string; date: string; lat: number | null; lng: number | null; products: ProductDto[];
}
export interface PublicUser { id: number; login: string; createdAt: string }
export interface UserRecord { id: number; login: string; passwordHash: string }
export interface ProductFilters { type?: string; specification?: string }

export interface NewOrder { title: string; description?: string; lat?: number | null; lng?: number | null }
export interface NewProduct {
  title: string; serialNumber: number; type: string; specification?: string; isNew?: boolean; orderId: number;
  priceUsd: number; priceUah: number; guaranteeStart: string; guaranteeEnd: string;
}

// Хранилище данных. Приложению всё равно, что за ним стоит: MySQL (repo.mysql.ts) или память (repo.memory.ts).
export interface Repo {
  init(): Promise<void>;
  getOrders(): Promise<OrderDto[]>;
  createOrder(b: NewOrder): Promise<number>;
  deleteOrder(id: number): Promise<boolean>;
  orderExists(id: number): Promise<boolean>;
  getProducts(f?: ProductFilters): Promise<ProductDto[]>;
  getTypes(): Promise<string[]>;
  getSpecifications(): Promise<string[]>;
  createProduct(b: NewProduct): Promise<number>;
  deleteProduct(id: number): Promise<boolean>;
  getUsers(): Promise<PublicUser[]>;
  findUser(login: string): Promise<UserRecord | undefined>;
}
