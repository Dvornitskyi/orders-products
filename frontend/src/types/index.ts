// Формат данных совпадает с app.js из тестового задания
export interface Price { value: number; symbol: string; isDefault: number }
export interface Product {
  id: number; serialNumber: number; isNew: number; photo: string; title: string; type: string; specification: string;
  guarantee: { start: string; end: string }; price: Price[]; order: number; orderTitle: string; date: string;
}
export interface Order {
  id: number; title: string; description: string; date: string; lat: number | null; lng: number | null; products: Product[];
}
export interface User { id: number; login: string; createdAt: string }
export interface ErrorPayload { status: number; errors: string[] }
