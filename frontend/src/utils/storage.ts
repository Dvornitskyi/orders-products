// Web Storage (localStorage). Обёртка с try/catch: в приватном режиме или на сервере доступ может бросать ошибку.
const get = (k: string): string | null => { try { return window.localStorage.getItem(k); } catch { return null; } };
const set = (k: string, v: string) => { try { window.localStorage.setItem(k, v); } catch { /* игнорируем */ } };
const remove = (k: string) => { try { window.localStorage.removeItem(k); } catch { /* игнорируем */ } };

export const LOCALE_KEY = 'locale';
export interface Session { token: string; login: string }

export const loadSession = (): Session | null => {
  const token = get('token'), login = get('login');
  return token && login ? { token, login } : null;
};
export const saveSession = (s: Session) => { set('token', s.token); set('login', s.login); };
export const clearSession = () => { remove('token'); remove('login'); };
export const loadLocale = () => get(LOCALE_KEY);
export const saveLocale = (l: string) => {
  set(LOCALE_KEY, l);
  document.cookie = `${LOCALE_KEY}=${l}; path=/; max-age=31536000; samesite=lax`; // cookie нужна, чтобы SSR знал язык
};
