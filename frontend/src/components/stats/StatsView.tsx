'use client';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useI18n } from '@/i18n/I18nProvider';
import { currencyLabel, formatMoney } from '@/utils/format';
import { useStatsData } from '@/hooks/useStatsData';
import type { Order } from '@/types';

const ROW_HEIGHT = 34; // px на один приход
const COLORS = ['#7cb342', '#2d3a45', '#f4a63a', '#4a90b8', '#b8566b', '#8a99a6'];

export default function StatsView({ orders }: { orders: Order[] }) {
  const { t, typeLabel } = useI18n();
  const currencies = [...new Set(orders.flatMap((o) => o.products.flatMap((p) => p.price.map((x) => x.symbol))))];
  const [symbol, setSymbol] = useState(currencies.includes('UAH') ? 'UAH' : currencies[0] ?? 'UAH');
  const { data, engine } = useStatsData(orders, symbol); // считает Web Worker
  if (!data) return <p className="text-muted">{t('loading')}</p>;
  const { bars } = data;
  const pie = data.pie.map((x) => ({ ...x, name: typeLabel(x.name) })); // типы продуктов на языке интерфейса

  return (
    <>
    <div className="stats">
      <div className="stats__card">
        <div className="stats__head">
          <h2 className="stats__title">{t('chartOrderTotals')}</h2>
          <label className="filter">
            <span className="filter__label">{t('currency')}:</span>
            <select className="form-select filter__select filter__select--narrow" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
              {currencies.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        </div>
        {/* Горизонтальные столбики: длинные названия помещаются слева. Высота растёт вместе с числом приходов,
            а если их очень много — блок прокручивается, а не сжимается в кашу. */}
        <div className="stats__chart stats__chart--scroll">
          <ResponsiveContainer width="100%" height={Math.max(320, bars.length * ROW_HEIGHT + 50)}>
            <BarChart data={bars} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dde3e9" horizontal={false} />
              <XAxis type="number" tickFormatter={(v: number) => formatMoney(v)} />
              <YAxis type="category" dataKey="name" width={200} interval={0} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `${formatMoney(Number(v))} ${currencyLabel(symbol)}`} labelFormatter={(_, p) => p?.[0]?.payload?.title ?? ''} />
              <Bar dataKey="value" fill="#7cb342" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="stats__card">
        <h2 className="stats__title">{t('chartByType')}</h2>
        <div className="stats__chart">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" outerRadius="75%" label>
                {pie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
    <p className="stats__note">{t(engine === 'worker' ? 'statsByWorker' : 'statsByMain')}</p>
    </>
  );
}
