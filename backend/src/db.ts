import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? 'root',
  database: process.env.DB_NAME ?? 'orders_products',
  charset: 'utf8mb4',
  dateStrings: true, // даты возвращаются строкой 'YYYY-MM-DD HH:MM:SS', как в app.js из ТЗ
  waitForConnections: true,
  connectionLimit: 10
});

// MySQL в Docker стартует дольше бэкенда — ждём, пока база ответит
export async function waitForDb(tries = 30) {
  for (let i = 1; i <= tries; i++) {
    try { await pool.query('SELECT 1'); return; }
    catch { console.log(`DB not ready (${i}/${tries})`); await new Promise((r) => setTimeout(r, 2000)); }
  }
  throw new Error('Database is unavailable');
}
