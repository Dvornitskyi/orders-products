import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { api, type ProductFilter } from '@/api';
import type { Product } from '@/types';

interface State { items: Product[]; types: string[]; specifications: string[]; type: string; specification: string; loading: boolean; failed: boolean; lastRequest: string }
const initialState: State = { items: [], types: [], specifications: [], type: '', specification: '', loading: false, failed: false, lastRequest: '' };

// Фильтры по типу и спецификации: REST-запрос GET /api/products?type=...&specification=...
export const loadProducts = createAsyncThunk('products/load', async (f: ProductFilter) => ({ f, items: await api.products(f) }));

// Обновление после события с сервера: заново грузим список (с текущими фильтрами), типы и спецификации
export const refreshProducts = createAsyncThunk('products/refresh', async (_, { getState }) => {
  const { type, specification } = (getState() as { products: State }).products;
  const [items, types, specifications] = await Promise.all([api.products({ type, specification }), api.productTypes(), api.productSpecifications()]);
  return { items, types, specifications };
});

const slice = createSlice({
  name: 'products', initialState,
  reducers: {
    setProducts(state, a: PayloadAction<{ items: Product[]; types: string[]; specifications: string[] }>) {
      state.items = a.payload.items; state.types = a.payload.types; state.specifications = a.payload.specifications;
      state.type = ''; state.specification = ''; state.failed = false;
    }
  },
  extraReducers: (b) => b
    // Выбранные фильтры запоминаем СРАЗУ (на pending), иначе второй select прочитает старое значение первого
    .addCase(loadProducts.pending, (s, a) => {
      s.loading = true; s.failed = false; s.lastRequest = a.meta.requestId;
      s.type = a.meta.arg.type ?? ''; s.specification = a.meta.arg.specification ?? '';
    })
    // Ответ применяем, только если это ответ на ПОСЛЕДНИЙ запрос: медленный старый ответ не должен затереть новый
    .addCase(loadProducts.fulfilled, (s, a) => { if (a.meta.requestId === s.lastRequest) { s.loading = false; s.items = a.payload.items; } })
    .addCase(refreshProducts.fulfilled, (s, a) => { s.items = a.payload.items; s.types = a.payload.types; s.specifications = a.payload.specifications; })
    .addCase(loadProducts.rejected, (s, a) => { if (a.meta.requestId === s.lastRequest) { s.loading = false; s.failed = true; } })
});
export const { setProducts } = slice.actions;
export default slice.reducer;
