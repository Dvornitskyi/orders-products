import cors from 'cors';
import express from 'express';
import type { Auth } from './auth';
import type { EventBus } from './events';
import { createGraphQL } from './graphql';
import type { Repo } from './types';
import { validateOrder, validateProduct } from './validate';

// Собираем приложение из частей: хранилище, шина событий, авторизация. Так его можно запускать
// и с MySQL (боевой режим), и с памятью (тесты, запуск без базы).
export function createApp({ repo, bus, auth }: { repo: Repo; bus: EventBus; auth: Auth }) {
  const app = express();
  app.use(cors());
  app.use('/api/graphql', createGraphQL({ repo, bus, auth })); // до express.json: GraphQL сам читает тело запроса
  app.use(express.json());

  app.get('/api/health', (_req, res) => { res.json({ ok: true }); });

  app.post('/api/auth/login', async (req, res) => {
    const { login, password } = req.body ?? {};
    const result = typeof login === 'string' && typeof password === 'string' ? await auth.authenticate(login, password) : null;
    if (!result) { res.status(401).json({ error: 'Invalid login or password' }); return; }
    res.json(result);
  });

  // Список пользователей — только с JWT (там есть логины людей)
  app.get('/api/users', auth.requireAuth, async (_req, res) => { res.json(await repo.getUsers()); });

  // Чтение открыто (нужно для SSR), изменения — только с JWT. После каждого изменения публикуем событие.
  app.get('/api/orders', async (_req, res) => { res.json(await repo.getOrders()); });
  app.post('/api/orders', auth.requireAuth, async (req, res) => {
    const errors = validateOrder(req.body ?? {});
    if (errors.length) { res.status(400).json({ errors }); return; }
    const id = await repo.createOrder(req.body);
    bus.publish({ type: 'order.created', id });
    res.status(201).json({ id });
  });
  app.delete('/api/orders/:id', auth.requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    const ok = await repo.deleteOrder(id);
    if (ok) bus.publish({ type: 'order.deleted', id });
    res.sendStatus(ok ? 204 : 404);
  });

  app.get('/api/products/types', async (_req, res) => { res.json(await repo.getTypes()); });
  app.get('/api/products/specifications', async (_req, res) => { res.json(await repo.getSpecifications()); });
  app.get('/api/products', async (req, res) => {
    const q = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
    res.json(await repo.getProducts({ type: q(req.query.type), specification: q(req.query.specification) }));
  });
  app.post('/api/products', auth.requireAuth, async (req, res) => {
    const errors = validateProduct(req.body ?? {});
    if (errors.length) { res.status(400).json({ errors }); return; }
    if (!(await repo.orderExists(Number(req.body.orderId)))) { res.status(400).json({ errors: ['orderId: order not found'] }); return; }
    const id = await repo.createProduct(req.body);
    bus.publish({ type: 'product.created', id, orderId: Number(req.body.orderId) });
    res.status(201).json({ id });
  });
  app.delete('/api/products/:id', auth.requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    const ok = await repo.deleteProduct(id);
    if (ok) bus.publish({ type: 'product.deleted', id });
    res.sendStatus(ok ? 204 : 404);
  });

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
