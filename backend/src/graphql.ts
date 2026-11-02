import { createSchema, createYoga, maskError } from 'graphql-yoga';
import { GraphQLError } from 'graphql';
import type { Auth } from './auth';
import type { EventBus } from './events';
import type { NewOrder, NewProduct, Repo } from './types';
import { validateOrder, validateProduct } from './validate';

// GraphQL: один адрес и язык запросов, в котором клиент сам выбирает нужные поля.
// Резолверы вызывают тот же Repo и публикуют те же события, что и REST — бизнес-логика не дублируется.
const typeDefs = /* GraphQL */ `
  type Price { value: Float!, symbol: String!, isDefault: Int! }
  type Guarantee { start: String!, end: String! }
  type Product {
    id: Int!, serialNumber: Float!, isNew: Int!, photo: String!, title: String!, type: String!, specification: String!
    guarantee: Guarantee!, price: [Price!]!, order: Int!, orderTitle: String!, date: String!
  }
  type Order { id: Int!, title: String!, description: String!, date: String!, lat: Float, lng: Float, products: [Product!]! }
  type User { id: Int!, login: String!, createdAt: String! }
  type AuthPayload { token: String!, login: String! }

  input OrderInput { title: String!, description: String, lat: Float, lng: Float }
  input ProductInput {
    title: String!, serialNumber: Float!, type: String!, specification: String, isNew: Boolean, orderId: Int!
    priceUsd: Float!, priceUah: Float!, guaranteeStart: String!, guaranteeEnd: String!
  }

  type Query {
    orders: [Order!]!
    products(type: String, specification: String): [Product!]!
    productTypes: [String!]!
    productSpecifications: [String!]!
    users: [User!]!
  }
  type Mutation {
    login(login: String!, password: String!): AuthPayload!
    createOrder(input: OrderInput!): Int!
    deleteOrder(id: Int!): Boolean!
    createProduct(input: ProductInput!): Int!
    deleteProduct(id: Int!): Boolean!
  }
`;

interface Ctx { authorized: boolean }

// Коды ошибок, по которым фронтенд понимает, что произошло (аналог HTTP-статусов 401 / 400 / 404)
const fail = (message: string, code: string, errors?: string[]) => new GraphQLError(message, { extensions: { code, ...(errors ? { errors } : {}) } });
const need = (ctx: Ctx) => { if (!ctx.authorized) throw fail('Unauthorized', 'UNAUTHENTICATED'); };

export function createGraphQL({ repo, bus, auth }: { repo: Repo; bus: EventBus; auth: Auth }) {
  const schema = createSchema<Ctx>({
    typeDefs,
    resolvers: {
      Query: {
        orders: () => repo.getOrders(),
        products: (_: unknown, a: { type?: string; specification?: string }) => repo.getProducts({ type: a.type || undefined, specification: a.specification || undefined }),
        productTypes: () => repo.getTypes(),
        productSpecifications: () => repo.getSpecifications(),
        users: (_: unknown, __: unknown, ctx: Ctx) => { need(ctx); return repo.getUsers(); }
      },
      Mutation: {
        login: async (_: unknown, a: { login: string; password: string }) => {
          const result = await auth.authenticate(a.login, a.password);
          if (!result) throw fail('Invalid login or password', 'UNAUTHENTICATED');
          return result;
        },
        createOrder: async (_: unknown, a: { input: NewOrder }, ctx: Ctx) => {
          need(ctx);
          const errors = validateOrder({ ...a.input });
          if (errors.length) throw fail('Validation failed', 'BAD_USER_INPUT', errors);
          const id = await repo.createOrder(a.input);
          bus.publish({ type: 'order.created', id });
          return id;
        },
        deleteOrder: async (_: unknown, a: { id: number }, ctx: Ctx) => {
          need(ctx);
          if (!(await repo.deleteOrder(a.id))) throw fail('Not found', 'NOT_FOUND');
          bus.publish({ type: 'order.deleted', id: a.id });
          return true;
        },
        createProduct: async (_: unknown, a: { input: NewProduct }, ctx: Ctx) => {
          need(ctx);
          const errors = validateProduct({ ...a.input });
          if (errors.length) throw fail('Validation failed', 'BAD_USER_INPUT', errors);
          if (!(await repo.orderExists(a.input.orderId))) throw fail('Validation failed', 'BAD_USER_INPUT', ['orderId: order not found']);
          const id = await repo.createProduct(a.input);
          bus.publish({ type: 'product.created', id, orderId: a.input.orderId });
          return id;
        },
        deleteProduct: async (_: unknown, a: { id: number }, ctx: Ctx) => {
          need(ctx);
          if (!(await repo.deleteProduct(a.id))) throw fail('Not found', 'NOT_FOUND');
          bus.publish({ type: 'product.deleted', id: a.id });
          return true;
        }
      }
    }
  });

  return createYoga<object, Ctx>({
    schema,
    graphqlEndpoint: '/api/graphql',
    // Токен берём из того же заголовка Authorization, что и в REST
    context: ({ request }) => ({ authorized: auth.verifyHeader(request.headers.get('authorization')) }),
    graphiql: { title: 'Orders & Products — GraphQL' }, // страница для пробы запросов: http://localhost:4000/api/graphql
    logging: false,
    // Yoga прячет «неожиданные» ошибки за текстом «Unexpected error». Наши ошибки с кодом (401/400/404-аналоги) — ожидаемые,
    // поэтому пропускаем их как есть, а всё остальное маскируем как обычно.
    maskedErrors: {
      maskError: (error, message, isDev) => {
        const ext = (error as { extensions?: { code?: string } }).extensions ?? (error as { originalError?: { extensions?: { code?: string } } }).originalError?.extensions;
        return ext?.code && ext.code !== 'INTERNAL_SERVER_ERROR' ? (error as Error) : maskError(error, message, isDev);
      }
    }
  });
}
