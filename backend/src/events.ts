import { EventEmitter } from 'node:events';

// Event-Driven Architecture: код, который что-то изменил, лишь ОБЪЯВЛЯЕТ факт («приход создан»).
// Кто на это отреагирует (сокеты, аудит, в будущем почта или очередь) — ему неизвестно и не важно.
export type DomainEvent =
  | { type: 'order.created'; id: number }
  | { type: 'order.deleted'; id: number }
  | { type: 'product.created'; id: number; orderId: number }
  | { type: 'product.deleted'; id: number };

export type StampedEvent = DomainEvent & { at: string };
export interface EventBus {
  publish(e: DomainEvent): void;
  subscribe(handler: (e: StampedEvent) => void): () => void; // возвращает функцию отписки
}

export function createEventBus(): EventBus {
  const emitter = new EventEmitter();
  return {
    publish(e) { emitter.emit('event', { ...e, at: new Date().toISOString() } satisfies StampedEvent); },
    subscribe(handler) { emitter.on('event', handler); return () => emitter.off('event', handler); }
  };
}

// Подписчик «журнал аудита»: пишет каждое событие в лог (в Docker: docker compose logs backend)
export function attachAudit(bus: EventBus, log: (line: string) => void = console.log) {
  return bus.subscribe((e) => log(`[event] ${e.at} ${e.type} ${JSON.stringify(e, (k, v) => (k === 'type' || k === 'at' ? undefined : v))}`));
}
