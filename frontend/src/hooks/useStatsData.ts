'use client';
import { useEffect, useRef, useState } from 'react';
import type { StatsRequest, StatsResponse } from '@/workers/stats.worker';
import type { Order } from '@/types';
import { totalsChart, typesChart } from '@/utils/stats';

type Data = Pick<StatsResponse, 'bars' | 'pie'>;

// Данные для графиков считаются в Web Worker. Если воркер недоступен (старый браузер, ошибка загрузки),
// считаем в основном потоке — страница всё равно работает. Поле `engine` показывает, кто посчитал.
export function useStatsData(orders: Order[], symbol: string) {
  const [data, setData] = useState<Data | null>(null);
  const [engine, setEngine] = useState<'worker' | 'main'>('worker');
  const worker = useRef<Worker | null>(null);
  const latest = useRef(0); // номер последнего запроса: ответ на устаревший игнорируем

  useEffect(() => {
    const id = ++latest.current;
    const fallback = () => { setEngine('main'); setData({ bars: totalsChart(orders, symbol), pie: typesChart(orders) }); };

    if (typeof Worker === 'undefined') { fallback(); return; }
    try {
      if (!worker.current) {
        worker.current = new Worker(new URL('../workers/stats.worker.ts', import.meta.url));
      }
      const w = worker.current;
      w.onmessage = (e: MessageEvent<StatsResponse>) => { if (e.data.id === latest.current) { setEngine('worker'); setData({ bars: e.data.bars, pie: e.data.pie }); } };
      w.onerror = () => { w.terminate(); worker.current = null; fallback(); };
      w.postMessage({ id, orders, symbol } satisfies StatsRequest);
    } catch { fallback(); }
  }, [orders, symbol]);

  useEffect(() => () => { worker.current?.terminate(); worker.current = null; }, []);

  return { data, engine };
}
