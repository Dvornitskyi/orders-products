import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { createAuth } from '../src/auth';
import { createEventBus, type StampedEvent } from '../src/events';
import { createMemoryRepo } from '../src/repo.memory';

// Интеграционные тесты: настоящий Express-приложение + роуты + авторизация + валидация + хранилище + шина событий,
// без сети и без базы (хранилище в памяти). Запросы идут через supertest так, как их отправил бы браузер.
async function setup() {
  const repo = createMemoryRepo();
  const bus = createEventBus();
  const events: StampedEvent[] = [];
  bus.subscribe((e) => events.push(e));
  await repo.init();
  const app = createApp({ repo, bus, auth: createAuth(repo) });
  const login = await request(app).post('/api/auth/login').send({ login: 'admin', password: 'admin123' });
  return { app, events, token: login.body.token as string };
}
let ctx: Awaited<ReturnType<typeof setup>>;
const bearer = () => ({ Authorization: `Bearer ${ctx.token}` });
beforeEach(async () => { ctx = await setup(); });

describe('auth', () => {
  it('logs in with the right password and rejects the wrong one', async () => {
    expect(ctx.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    const bad = await request(ctx.app).post('/api/auth/login').send({ login: 'admin', password: 'nope' });
    expect(bad.status).toBe(401);
  });
  it('protects changing requests and the users list', async () => {
    expect((await request(ctx.app).post('/api/orders').send({ title: 'abc' })).status).toBe(401);
    expect((await request(ctx.app).get('/api/users')).status).toBe(401);
    const users = await request(ctx.app).get('/api/users').set(bearer());
    expect(users.body).toEqual([{ id: 1, login: 'admin', createdAt: expect.any(String) }]); // без хеша пароля
  });
});

describe('orders and products', () => {
  it('reads seeded data without a token', async () => {
    const res = await request(ctx.app).get('/api/orders');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0].products[0].price).toHaveLength(2);
  });
  it('validates input', async () => {
    const res = await request(ctx.app).post('/api/orders').set(bearer()).send({ title: 'ab', lat: 120 });
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
  it('creates an order, adds a product to it, then cascades on delete', async () => {
    const created = await request(ctx.app).post('/api/orders').set(bearer()).send({ title: 'Новый приход', description: 'тест' });
    expect(created.status).toBe(201);
    const orderId = created.body.id;
    const product = await request(ctx.app).post('/api/products').set(bearer()).send({
      title: 'Test monitor', serialNumber: 777, type: 'Monitors', specification: 'Spec X', orderId, priceUsd: 10, priceUah: 260,
      guaranteeStart: '2020-01-01', guaranteeEnd: '2021-01-01'
    });
    expect(product.status).toBe(201);
    expect((await request(ctx.app).get('/api/products')).body.some((p: { id: number }) => p.id === product.body.id)).toBe(true);
    expect((await request(ctx.app).delete(`/api/orders/${orderId}`).set(bearer())).status).toBe(204);
    expect((await request(ctx.app).get('/api/products')).body.some((p: { id: number }) => p.id === product.body.id)).toBe(false);
    expect((await request(ctx.app).delete(`/api/orders/${orderId}`).set(bearer())).status).toBe(404);
  });
  it('rejects a product for a missing order', async () => {
    const res = await request(ctx.app).post('/api/products').set(bearer()).send({
      title: 'Orphan', serialNumber: 1, type: 'Mice', orderId: 999, priceUsd: 1, priceUah: 26, guaranteeStart: '2020-01-01', guaranteeEnd: '2021-01-01'
    });
    expect(res.status).toBe(400);
  });
  it('filters products by type and specification together', async () => {
    const monitors = await request(ctx.app).get('/api/products').query({ type: 'Monitors' });
    expect(monitors.body.every((p: { type: string }) => p.type === 'Monitors')).toBe(true);
    const both = await request(ctx.app).get('/api/products').query({ type: 'Monitors', specification: 'Specification 5' });
    expect(both.body).toHaveLength(1);
    expect((await request(ctx.app).get('/api/products/types')).body).toEqual(['Keyboards', 'Mice', 'Monitors']);
  });
});

describe('events (EDA)', () => {
  it('publishes an event after every successful change, and none after a failed one', async () => {
    await request(ctx.app).post('/api/orders').set(bearer()).send({ title: 'ab' });              // невалидно → события нет
    expect(ctx.events).toHaveLength(0);
    const created = await request(ctx.app).post('/api/orders').set(bearer()).send({ title: 'Приход' });
    await request(ctx.app).delete(`/api/orders/${created.body.id}`).set(bearer());
    expect(ctx.events.map((e) => e.type)).toEqual(['order.created', 'order.deleted']);
    expect(ctx.events[0]).toMatchObject({ id: created.body.id, at: expect.any(String) });
  });
});
