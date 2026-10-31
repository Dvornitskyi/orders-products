export const pad = (n: number) => String(n).padStart(2, '0');

// Бэкенд отдаёт даты как 'YYYY-MM-DD HH:MM:SS' (без часовой зоны). Разбираем вручную,
// чтобы сервер и браузер показывали одинаковый результат (иначе будет ошибка гидратации).
export function parseDate(s: string): Date {
  const [d, t = '00:00:00'] = s.replace('T', ' ').split(' ');
  const [y, m, day] = d.split('-').map(Number);
  const [h, mi, sec] = t.split(':').map(Number);
  return new Date(y, m - 1, day, h || 0, mi || 0, Math.floor(sec) || 0);
}

// Формат 1 (мелкий, как на макете): номер месяца / 12  → "04 / 12"
export const formatMonthOfYear = (s: string) => `${pad(parseDate(s).getMonth() + 1)} / 12`;
// Формат 2: "06 / Апр / 2017" (название месяца зависит от языка)
export function formatLong(s: string, months: readonly string[]) {
  const d = parseDate(s);
  return `${pad(d.getDate())} / ${months[d.getMonth()]} / ${d.getFullYear()}`;
}
// Числовой формат: "06 / 04 / 2017" (для гарантии)
export function formatNumeric(s: string) {
  const d = parseDate(s);
  return `${pad(d.getDate())} / ${pad(d.getMonth() + 1)} / ${d.getFullYear()}`;
}

// 250000.5 → "250 000.50", 2500 → "2 500"
export function formatMoney(n: number) {
  const [int, frac] = n.toFixed(2).split('.');
  const spaced = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return frac === '00' ? spaced : `${spaced}.${frac}`;
}
export const currencyLabel = (symbol: string) => (symbol === 'USD' ? '$' : symbol);
