import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/api';
import { toPayload } from '@/api/errors';
import { clearSession, saveSession, type Session } from '@/utils/storage';
import type { ErrorPayload } from '@/types';

export interface AuthState { token: string | null; login: string | null; ready: boolean }
const initialState: AuthState = { token: null, login: null, ready: false };

export const login = createAsyncThunk<Session, { login: string; password: string }, { rejectValue: ErrorPayload }>(
  'auth/login',
  async (c, { rejectWithValue }) => {
    try { const s = await api.login(c.login, c.password); saveSession(s); return s; }
    catch (e) { return rejectWithValue(toPayload(e)); }
  }
);
export const logout = createAsyncThunk('auth/logout', async () => { clearSession(); });

const slice = createSlice({
  name: 'auth', initialState,
  reducers: {
    // вызывается один раз при старте: подхватываем сессию из localStorage
    sessionRestored(state, a: PayloadAction<Session | null>) {
      state.ready = true; state.token = a.payload?.token ?? null; state.login = a.payload?.login ?? null;
    }
  },
  extraReducers: (b) => b
    .addCase(login.fulfilled, (s, a) => { s.token = a.payload.token; s.login = a.payload.login; })
    .addCase(logout.fulfilled, (s) => { s.token = null; s.login = null; })
});
export const { sessionRestored } = slice.actions;
export default slice.reducer;
