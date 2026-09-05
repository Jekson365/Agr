import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import type { MarketSale } from '@/types/market-sale';
import { salesCell, type SalesCellContext } from './sales-cell';
import { SALES_COLUMNS, type SalesColumnId } from './sales-columns';
import './sales-table.css';

type Props = {
  sales: MarketSale[];
  busyId: number | null;
  hidden: SalesColumnId[];
  onToggle: (sale: MarketSale) => void;
  onDelete: (sale: MarketSale) => void;
};

export function SalesTable({ sales, busyId, hidden, onToggle, onDelete }: Props) {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const hiddenSet = new Set(hidden);
  const columns = SALES_COLUMNS.filter((column) => !hiddenSet.has(column.id));
  const context: SalesCellContext = { t, language, formatPrice, busyId, onToggle, onDelete };

  const amountIndex = columns.findIndex((column) => column.id === 'amount');
  const trailing = columns.length - amountIndex - 1;
  const total = sales.reduce((sum, sale) => sum + sale.amount, 0);

  return (
    <div className="sales-table-wrap">
      <table className="sales-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                data-col={column.id}
                className={column.numeric ? 'numeric' : undefined}
              >
                {t(column.labelKey)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id} className={busyId === sale.id ? 'busy' : undefined}>
              {columns.map((column) => (
                <td
                  key={column.id}
                  data-col={column.id}
                  className={column.numeric ? 'numeric' : undefined}
                >
                  {salesCell(sale, column.id, context)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>

        {amountIndex > 0 && (
          <tfoot>
            <tr>
              <td colSpan={amountIndex}>{t('sales.chartTotal')}</td>
              <td className="numeric sales-total">{formatPrice(total)}</td>
              {trailing > 0 && <td colSpan={trailing} />}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
