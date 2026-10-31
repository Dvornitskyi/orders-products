// ЭТАП 1: временный «бэкенд» в памяти. Без базы и без Docker.
// Отдаёт те же URL и тот же JSON, что и настоящий бэкенд (этап 2), поэтому фронтенд не замечает разницы.
// Данные живут, пока процесс работает: перезапустили — вернулись начальные.
import http from 'node:http';

const PORT = Number(process.env.PORT ?? 4000);
const LOGIN = 'admin', PASSWORD = 'admin123';

const GUARANTEE = { start: '2017-04-06 12:00:00', end: '2025-08-06 12:00:00' };
const prices = (usd, uah) => [{ value: usd, symbol: 'USD', isDefault: 0 }, { value: uah, symbol: 'UAH', isDefault: 1 }];
const orders = [
  { id: 1, title: 'Длинное предлинное длиннючее название прихода', description: 'Основная поставка мониторов', lat: 50.4501, lng: 30.5234, date: '2017-04-06 12:09:33' },
  { id: 2, title: 'Длинное название прихода', description: 'Периферия', lat: 49.8397, lng: 24.0297, date: '2017-09-06 12:09:33' },
  { id: 3, title: 'Длинное предлинное название прихода', description: 'Мыши и мониторы', lat: 46.4825, lng: 30.7233, date: '2017-06-06 12:09:33' }
];
const mk = (id, serialNumber, isNew, photo, title, type, order, usd, uah) =>
  ({ id, serialNumber, isNew, photo, title, type, specification: `Specification ${id}`, guarantee: { ...GUARANTEE }, price: prices(usd, uah), order, date: '2017-06-29 12:09:33' });
let products = [
  mk(1, 12345678, 1, 'monitor.svg', 'Gigabyte Technology X58-USB3', 'Monitors', 1, 100, 2600),
  mk(2, 12345679, 1, 'monitor.svg', 'Dell U2415', 'Monitors', 1, 250, 6500),
  mk(3, 12345680, 0, 'keyboard.svg', 'Logitech MX Keys', 'Keyboards', 2, 90, 2340),
  mk(4, 12345681, 1, 'mouse.svg', 'Razer DeathAdder', 'Mice', 3, 60, 1560),
  mk(5, 12345682, 1, 'monitor.svg', 'Samsung Odyssey G5', 'Monitors', 3, 320, 8320),
  mk(6, 12345683, 0, 'monitor.svg', 'HP 24mh', 'Monitors', 2, 140, 3640)
];
const users = [{ id: 1, login: LOGIN, createdAt: '2017-03-12 17:20:00' }];
let nextOrder = 4, nextProduct = 7;

const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
// Токен имеет форму настоящего JWT (header.payload.signature), но подпись здесь фейковая — это просто заглушка.
const fakeJwt = () => `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: LOGIN, exp: Math.floor(Date.now() / 1000) + 8 * 3600 })}.mock`;

const withProducts = () => orders.map((o) => ({ ...o, products: products.filter((p) => p.order === o.id).map((p) => ({ ...p, orderTitle: o.title })) }));
const withTitle = (p) => ({ ...p, orderTitle: orders.find((o) => o.id === p.order)?.title ?? '' });

// Те же правила, что и у настоящего бэкенда (backend/src/validate.ts)
const str = (v) => (typeof v === 'string' ? v.trim() : '');
const num = (v) => (v === null || v === undefined || v === '' ? NaN : Number(v));
function validateOrder(b) {
  const e = [];
  if (str(b.title).length < 3) e.push('title: min 3 chars');
  if (str(b.description).length > 500) e.push('description: max 500 chars');
  for (const [k, max] of [['lat', 90], ['lng', 180]]) if (b[k] != null && !(Math.abs(num(b[k])) <= max)) e.push(`${k}: out of range`);
  return e;
}
function validateProduct(b) {
  const e = [];
  if (str(b.title).length < 3) e.push('title: min 3 chars');
  if (!Number.isInteger(num(b.serialNumber)) || num(b.serialNumber) <= 0) e.push('serialNumber: positive integer');
  if (!str(b.type)) e.push('type: required');
  if (!Number.isInteger(num(b.orderId))) e.push('orderId: required');
  for (const k of ['priceUsd', 'priceUah']) if (!(num(b[k]) >= 0)) e.push(`${k}: must be >= 0`);
  const s = str(b.guaranteeStart), en = str(b.guaranteeEnd);
  if (!s || !en || en < s) e.push('guarantee: end must not be before start');
  return e;
}

const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' });
  res.end(body === undefined ? undefined : JSON.stringify(body));
};
const readBody = (req) => new Promise((resolve) => {
  let raw = ''; req.on('data', (c) => (raw += c));
  req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { resolve({}); } });
});
const authed = (req) => {
  const t = (req.headers.authorization ?? '').replace('Bearer ', '');
  try { return JSON.parse(Buffer.from(t.split('.')[1], 'base64url').toString()).exp * 1000 > Date.now(); } catch { return false; }
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const path = url.pathname, m = req.method;
  if (m === 'OPTIONS') return send(res, 204);
  if (path === '/api/health') return send(res, 200, { ok: true, mock: true });

  if (path === '/api/auth/login' && m === 'POST') {
    const b = await readBody(req);
    return b.login === LOGIN && b.password === PASSWORD ? send(res, 200, { token: fakeJwt(), login: LOGIN }) : send(res, 401, { error: 'Invalid login or password' });
  }

  if (path === '/api/users' && m === 'GET') return authed(req) ? send(res, 200, users) : send(res, 401, { error: 'Unauthorized' });
  if (path === '/api/orders' && m === 'GET') return send(res, 200, withProducts());
  if (path === '/api/products/types' && m === 'GET') return send(res, 200, [...new Set(products.map((p) => p.type))].sort());
  if (path === '/api/products/specifications' && m === 'GET') return send(res, 200, [...new Set(products.map((p) => p.specification).filter(Boolean))].sort());
  if (path === '/api/products' && m === 'GET') {
    const type = url.searchParams.get('type'), spec = url.searchParams.get('specification');
    return send(res, 200, products.filter((p) => (!type || p.type === type) && (!spec || p.specification === spec)).map(withTitle));
  }

  // Всё ниже меняет данные — нужен токен
  if (m === 'POST' || m === 'DELETE') {
    if (!authed(req)) return send(res, 401, { error: 'Unauthorized' });
    const id = Number(path.split('/')[3]);
    if (path === '/api/orders' && m === 'POST') {
      const b = await readBody(req), errors = validateOrder(b);
      if (errors.length) return send(res, 400, { errors });
      orders.push({ id: nextOrder, title: b.title.trim(), description: str(b.description), lat: b.lat ?? null, lng: b.lng ?? null, date: now() });
      return send(res, 201, { id: nextOrder++ });
    }
    if (path.startsWith('/api/orders/') && m === 'DELETE') {
      const i = orders.findIndex((o) => o.id === id);
      if (i < 0) return send(res, 404);
      orders.splice(i, 1); products = products.filter((p) => p.order !== id); // каскад, как ON DELETE CASCADE
      return send(res, 204);
    }
    if (path === '/api/products' && m === 'POST') {
      const b = await readBody(req), errors = validateProduct(b);
      if (errors.length) return send(res, 400, { errors });
      if (!orders.some((o) => o.id === Number(b.orderId))) return send(res, 400, { errors: ['orderId: order not found'] });
      products.push({
        id: nextProduct, serialNumber: Number(b.serialNumber), isNew: b.isNew ? 1 : 0, photo: 'monitor.svg', title: b.title.trim(), type: b.type.trim(),
        specification: str(b.specification), guarantee: { start: b.guaranteeStart, end: b.guaranteeEnd }, price: prices(Number(b.priceUsd), Number(b.priceUah)),
        order: Number(b.orderId), date: now()
      });
      return send(res, 201, { id: nextProduct++ });
    }
    if (path.startsWith('/api/products/') && m === 'DELETE') {
      const before = products.length;
      products = products.filter((p) => p.id !== id);
      return send(res, products.length < before ? 204 : 404);
    }
  }
  send(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => console.log(`[mock] тестовый API на http://localhost:${PORT} (admin / admin123)`));
