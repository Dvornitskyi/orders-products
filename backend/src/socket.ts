import type http from 'node:http';
import { Server } from 'socket.io';
import type { EventBus } from './events';

// WebSocket: (1) счётчик активных вкладок, (2) доставка событий из шины всем открытым вкладкам
export function attachSocket(server: http.Server, bus: EventBus) {
  const io = new Server(server, { cors: { origin: true } });
  const broadcast = () => io.emit('sessions', io.of('/').sockets.size);
  io.on('connection', (socket) => { broadcast(); socket.on('disconnect', broadcast); });
  bus.subscribe((e) => io.emit('domain-event', e)); // подписчик шины: браузеры узнают об изменениях без опроса
  return io;
}
