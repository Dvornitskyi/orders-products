import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { createAuth } from '../src/auth';
import { createEventBus, type StampedEvent } from '../src/events';
import { createMemoryRepo } from '../src/repo.memory';

// Интеграционные тесты GraphQL: тот же Repo, та же авторизация и те же события, что и в REST.
async function setup() {
  const repo = createMemoryRepo();
  const bus = createEventBus();
  const events: StampedEvent[] = [];
  bus.subscribe((e) => events.push(e));
  await repo.init();
  const app = createApp({ repo, bus, auth: createAuth(repo) });
  const gql = (query: string, variables?: object, token?: string) =>
    request(app).post('/api/graphql').set(token ? { Authorization: `Bearer ${token}` } : {}).send({ query, variables });
  const login = await gql('mutation { login(login: "admin", password: "admin123") { token } }');
  return { gql, events, token: login.body.data.login.token as string };
}
let ctx: Awaited<ReturnType<typeof setup>>;
beforeEach(async () => { ctx = await setup(); });

describe('graphql queries', () => {
  it('returns only the fields that were asked for', async () => {
    const res = await ctx.gql('{ orders { id title products { title price { symbol value } } } }');
    expect(res.body.data.orders).toHaveLength(3);
    expect(Object.keys(res.body.data.orders[0]).sort()).toEqual(['id', 'products', 'title']);
    expect(res.body.data.orders[0].products[0].price).toEqual([{ symbol: 'USD', value: 100 }, { symbol: 'UAH', value: 2600 }]);
  });
  it('filters products with arguments', async () => {
    const res = await ctx.gql('{ products(type: "Mice") { title type } productTypes }');
    expect(res.body.data.products).toEqual([{ title: 'Razer DeathAdder', type: 'Mice' }]);
    expect(res.body.data.productTypes).toEqual(['Keyboards', 'Mice', 'Monitors']);
  });
  it('hides users from guests', async () => {
    const res = await ctx.gql('{ users { login } }');
    expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
    const ok = await ctx.gql('{ users { login } }', undefined, ctx.token);
    expect(ok.body.data.users).toEqual([{ login: 'admin' }]);
  });
});

describe('graphql mutations', () => {
  it('needs a token and reports a wrong password', async () => {
    const guest = await ctx.gql('mutation { createOrder(input: { title: "Приход" }) }');
    expect(guest.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
    const bad = await ctx.gql('mutation { login(login: "admin", password: "x") { token } }');
    expect(bad.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });
  it('validates input with the same rules as REST', async () => {
    const res = await ctx.gql('mutation { createOrder(input: { title: "ab" }) }', undefined, ctx.token);
    expect(res.body.errors[0].extensions).toMatchObject({ code: 'BAD_USER_INPUT', errors: ['title: min 3 chars'] });
  });
  it('creates and deletes, publishes events, answers NOT_FOUND for a missing id', async () => {
    const created = await ctx.gql('mutation($i: OrderInput!) { createOrder(input: $i) }', { i: { title: 'Новый приход' } }, ctx.token);
    const id = created.body.data.createOrder;
    const orders = await ctx.gql('{ orders { id } }');
    expect(orders.body.data.orders.some((o: { id: number }) => o.id === id)).toBe(true);
    expect((await ctx.gql('mutation($id: Int!) { deleteOrder(id: $id) }', { id }, ctx.token)).body.data.deleteOrder).toBe(true);
    const again = await ctx.gql('mutation($id: Int!) { deleteOrder(id: $id) }', { id }, ctx.token);
    expect(again.body.errors[0].extensions.code).toBe('NOT_FOUND');
    expect(ctx.events.map((e) => e.type)).toEqual(['order.created', 'order.deleted']);
  });
});
