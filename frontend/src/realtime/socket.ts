import { io, type Socket } from 'socket.io-client';

// Одно WebSocket-соединение на вкладку. Если бы счётчик вкладок и «живые обновления» открывали по своему соединению,
// каждая вкладка считалась бы дважды. Значение 'off' отключает WebSocket (например, когда сервера нет).
const URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';
let socket: Socket | null = null;

export const getSocket = (): Socket | null => (URL === 'off' ? null : (socket ??= io(URL)));
