import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { api, type OrderBody, type ProductBody } from '@/api';
import { toPayload } from '@/api/errors';
import type { ErrorPayload, Order } from '@/types';
import type { AuthState } from './authSlice';

type Cfg = { state: { auth: AuthState }; rejectValue: ErrorPayload };

export const reloadOrders = createAsyncThunk<Order[], void, Cfg>('orders/reload', async (_, { rejectWithValue }) => {
  try { return await api.orders(); } catch (e) { return rejectWithValue(toPayload(e)); }
});

// Все изменения: запрос к API с токеном → после успеха перезагружаем список
const mutation = <A,>(type: string, call: (arg: A, token: string | null) => Promise<unknown>) =>
  createAsyncThunk<void, A, Cfg>(type, async (arg, { getState, dispatch, rejectWithValue }) => {
    try { await call(arg, getState().auth.token); } catch (e) { return rejectWithValue(toPayload(e)); }
    await dispatch(reloadOrders());
  });

export const createOrder = mutation<OrderBody>('orders/create', api.createOrder);
export const deleteOrder = mutation<number>('orders/delete', api.deleteOrder);
export const createProduct = mutation<ProductBody>('orders/createProduct', api.createProduct);
export const deleteProduct = mutation<number>('orders/deleteProduct', api.deleteProduct);

const slice = createSlice({
  name: 'orders', initialState: { items: [] as Order[] },
  reducers: { setOrders(state, a: PayloadAction<Order[]>) { state.items = a.payload; } },
  extraReducers: (b) => b.addCase(reloadOrders.fulfilled, (s, a) => { s.items = a.payload; })
});
export const { setOrders } = slice.actions;
export default slice.reducer;
