// JWT = три части base64url через точку. Средняя содержит данные, в частности exp (время окончания, секунды).
// Подпись мы на клиенте НЕ проверяем — это делает бэкенд; здесь только смотрим, не просрочен ли токен.
export function tokenExpiresAt(token: string): number | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const exp = JSON.parse(atob(payload)).exp;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch { return null; }
}
export const isExpired = (token: string, now = Date.now()) => {
  const at = tokenExpiresAt(token);
  return at === null || at <= now;
};
