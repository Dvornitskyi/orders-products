// Web Worker: отдельный поток браузера. Всё, что считается здесь, не блокирует интерфейс —
// страница не «подвисает», даже если приходов тысячи. Общение только сообщениями (postMessage).
import type { Order } from '@/types';
import { totalsChart, typesChart } from '@/utils/stats';

export interface StatsRequest { id: number; orders: Order[]; symbol: string }
export interface StatsResponse { id: number; bars: ReturnType<typeof totalsChart>; pie: ReturnType<typeof typesChart> }

self.onmessage = (e: MessageEvent<StatsRequest>) => {
  const { id, orders, symbol } = e.data;
  const res: StatsResponse = { id, bars: totalsChart(orders, symbol), pie: typesChart(orders) };
  self.postMessage(res);
};
