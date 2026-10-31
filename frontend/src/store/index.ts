import { configureStore } from '@reduxjs/toolkit';
import auth from './authSlice';
import orders from './ordersSlice';
import products from './productsSlice';
import search from './searchSlice';

// Фабрика, а не готовый объект: на сервере каждый запрос должен иметь собственный стор
export const makeStore = () => configureStore({ reducer: { auth, orders, products, search } });
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
