import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Текст из строки поиска в шапке. Лежит в Redux, чтобы его видели и Orders, и Products.
const slice = createSlice({
  name: 'search', initialState: { query: '' },
  reducers: { setQuery(state, a: PayloadAction<string>) { state.query = a.payload; } }
});
export const { setQuery } = slice.actions;
export default slice.reducer;
