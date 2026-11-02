import { currencyLabel, formatMoney } from '@/utils/format';
import type { Total } from '@/utils/totals';

// Дополнительная валюта — мелким шрифтом сверху, основная — крупным (как на макете)
export default function Money({ totals }: { totals: Pick<Total, 'symbol' | 'value' | 'isDefault'>[] }) {
  return (
    <div className="money">
      {totals.map((x) => (
        <div key={x.symbol} className={`money__line ${x.isDefault ? 'money__line--main' : 'money__line--small'}`}>
          {formatMoney(x.value)} <span className="money__cur">{currencyLabel(x.symbol)}</span>
        </div>
      ))}
    </div>
  );
}
