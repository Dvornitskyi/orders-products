import cors from 'cors';
import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import { authenticate, requireAuth } from './auth';
import { waitForDb } from './db';
import * as repo from './repo';
import { validateOrder, validateProduct } from './validate';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => { res.json({ ok: true }); });

app.post('/api/auth/login', async (req, res) => {
  const { login, password } = req.body ?? {};
  const result = typeof login === 'string' && typeof password === 'string' ? await authenticate(login, password) : null;
  if (!result) { res.status(401).json({ error: 'Invalid login or password' }); return; }
  res.json(result);
});

// Список пользователей — только с JWT (там есть логины людей)
app.get('/api/users', requireAuth, async (_req, res) => { res.json(await repo.getUsers()); });

// Чтение открыто (нужно для SSR), изменения — только с JWT
app.get('/api/orders', async (_req, res) => { res.json(await repo.getOrders()); });
app.post('/api/orders', requireAuth, async (req, res) => {
  const errors = validateOrder(req.body ?? {});
  if (errors.length) { res.status(400).json({ errors }); return; }
  res.status(201).json({ id: await repo.createOrder(req.body) });
});
app.delete('/api/orders/:id', requireAuth, async (req, res) => {
  res.sendStatus((await repo.deleteOrder(Number(req.params.id))) ? 204 : 404);
});

app.get('/api/products/types', async (_req, res) => { res.json(await repo.getTypes()); });
app.get('/api/products/specifications', async (_req, res) => { res.json(await repo.getSpecifications()); });
app.get('/api/products', async (req, res) => {
  const q = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
  res.json(await repo.getProducts({ type: q(req.query.type), specification: q(req.query.specification) }));
});
app.post('/api/products', requireAuth, async (req, res) => {
  const errors = validateProduct(req.body ?? {});
  if (errors.length) { res.status(400).json({ errors }); return; }
  if (!(await repo.orderExists(Number(req.body.orderId)))) { res.status(400).json({ errors: ['orderId: order not found'] }); return; }
  res.status(201).json({ id: await repo.createProduct(req.body) });
});
app.delete('/api/products/:id', requireAuth, async (req, res) => {
  res.sendStatus((await repo.deleteProduct(Number(req.params.id))) ? 204 : 404);
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// WebSocket: счётчик активных вкладок
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true } });
const broadcast = () => io.emit('sessions', io.of('/').sockets.size);
io.on('connection', (socket) => { broadcast(); socket.on('disconnect', broadcast); });

await waitForDb();
await repo.ensureAdmin();
const port = Number(process.env.PORT ?? 4000);
server.listen(port, () => console.log(`API listening on :${port}`));
