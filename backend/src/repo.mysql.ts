import bcrypt from 'bcryptjs';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool, waitForDb } from './db';
import type { NewOrder, NewProduct, ProductFilters, Repo } from './types';

type Row = RowDataPacket & Record<string, any>;

// Строка БД (snake_case) → формат API, как в app.js из ТЗ
const toProduct = (p: Row, prices: Row[]) => ({
  id: p.id, serialNumber: p.serial_number, isNew: p.is_new, photo: p.photo, title: p.title, type: p.type,
  specification: p.specification, guarantee: { start: p.guarantee_start, end: p.guarantee_end },
  price: prices.filter((x) => x.product_id === p.id).map((x) => ({ value: Number(x.amount), symbol: x.symbol, isDefault: x.is_default })),
  order: p.order_id, orderTitle: p.order_title, date: p.created_at
});

export function createMysqlRepo(): Repo {
  async function getProducts({ type, specification }: ProductFilters = {}) {
    // WHERE собираем из тех фильтров, которые реально заданы; значения идут отдельным массивом (защита от SQL-инъекций)
    const where: string[] = [], params: string[] = [];
    if (type) { where.push('p.type = ?'); params.push(type); }
    if (specification) { where.push('p.specification = ?'); params.push(specification); }
    const [rows] = await pool.query<Row[]>(
      `SELECT p.*, o.title AS order_title FROM products p JOIN orders o ON o.id = p.order_id ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY p.id`,
      params
    );
    const [prices] = await pool.query<Row[]>('SELECT * FROM prices');
    return rows.map((r) => toProduct(r, prices));
  }

  return {
    // Ждём базу (в Docker MySQL стартует дольше бэкенда) и создаём демо-пользователя, если таблица пуста
    async init() {
      await waitForDb();
      const [rows] = await pool.query<Row[]>('SELECT COUNT(*) AS n FROM users');
      if (rows[0].n === 0) {
        const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD ?? 'admin123', 10);
        await pool.execute('INSERT INTO users (login, password_hash) VALUES (?, ?)', [process.env.ADMIN_LOGIN ?? 'admin', hash]);
        console.log('Demo user created: admin');
      }
    },

    getProducts,

    async getTypes() {
      const [rows] = await pool.query<Row[]>('SELECT DISTINCT type FROM products ORDER BY type');
      return rows.map((r) => r.type as string);
    },

    async getSpecifications() {
      const [rows] = await pool.query<Row[]>("SELECT DISTINCT specification FROM products WHERE specification <> '' ORDER BY specification");
      return rows.map((r) => r.specification as string);
    },

    async getOrders() {
      const [orders] = await pool.query<Row[]>('SELECT * FROM orders ORDER BY id');
      const products = await getProducts();
      return orders.map((o) => ({
        id: o.id, title: o.title, description: o.description ?? '', date: o.created_at,
        lat: o.lat === null ? null : Number(o.lat), lng: o.lng === null ? null : Number(o.lng),
        products: products.filter((p) => p.order === o.id)
      }));
    },

    async createOrder(b: NewOrder) {
      const [r] = await pool.execute<ResultSetHeader>(
        'INSERT INTO orders (title, description, lat, lng) VALUES (?, ?, ?, ?)',
        [b.title.trim(), (b.description ?? '').trim(), b.lat ?? null, b.lng ?? null]
      );
      return r.insertId;
    },

    async deleteOrder(id) {
      const [r] = await pool.execute<ResultSetHeader>('DELETE FROM orders WHERE id = ?', [id]); // продукты удаляются каскадом
      return r.affectedRows > 0;
    },

    async orderExists(id) {
      const [rows] = await pool.query<Row[]>('SELECT id FROM orders WHERE id = ?', [id]);
      return rows.length > 0;
    },

    async createProduct(b: NewProduct) {
      const c = await pool.getConnection();
      try {
        await c.beginTransaction(); // продукт и его цены — одна транзакция
        const [r] = await c.execute<ResultSetHeader>(
          `INSERT INTO products (serial_number, is_new, photo, title, type, specification, guarantee_start, guarantee_end, order_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [b.serialNumber, b.isNew ? 1 : 0, 'monitor.svg', b.title.trim(), b.type.trim(), (b.specification ?? '').trim(), b.guaranteeStart, b.guaranteeEnd, b.orderId]
        );
        await c.execute('INSERT INTO prices (product_id, amount, symbol, is_default) VALUES (?, ?, ?, ?), (?, ?, ?, ?)',
          [r.insertId, b.priceUsd, 'USD', 0, r.insertId, b.priceUah, 'UAH', 1]);
        await c.commit();
        return r.insertId;
      } catch (e) { await c.rollback(); throw e; } finally { c.release(); }
    },

    async deleteProduct(id) {
      const [r] = await pool.execute<ResultSetHeader>('DELETE FROM products WHERE id = ?', [id]);
      return r.affectedRows > 0;
    },

    async getUsers() {
      const [rows] = await pool.query<Row[]>('SELECT id, login, created_at FROM users ORDER BY id'); // password_hash наружу не отдаём
      return rows.map((u) => ({ id: u.id as number, login: u.login as string, createdAt: u.created_at as string }));
    },

    async findUser(login) {
      const [rows] = await pool.query<Row[]>('SELECT id, login, password_hash FROM users WHERE login = ?', [login]);
      return rows[0] && { id: rows[0].id as number, login: rows[0].login as string, passwordHash: rows[0].password_hash as string };
    }
  };
}
