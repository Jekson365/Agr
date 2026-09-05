import { formatLocalizedIsoDateTime, formatLocalizedIsoDay, monthNames } from '@/components/ui/date-utils';
import { treeMovementReasonLabel } from '@/config/tree-planting';
import { useLanguage } from '@/contexts/language-context';
import type { StockMovementSource } from '@/types/stock-movement';
import type { TreeStockMovement } from '@/types/tree-stock-movement';
import { buildMovementGroups, type MovementRow } from './tree-movement-groups';
import './tree-movement-list.css';

const SOURCE_LABEL_KEY: Record<StockMovementSource, string> = {
  Manual: 'stockHistory.sourceManual',
  Harvest: 'stockHistory.sourceHarvest',
  Market: 'stockHistory.sourceMarket',
  Purchase: 'stockHistory.sourcePurchase',
};

type Props = {
  movements: TreeStockMovement[];
  amount: number;
  unitLabel: string;
  onDelete: (movement: TreeStockMovement) => void;
};

export function TreeMovementList({ movements, amount, unitLabel, onDelete }: Props) {
  const { t, language } = useLanguage();

  const groups = buildMovementGroups(movements, amount);
  const months = monthNames(language);

  function title(row: MovementRow): string {
    if (row.note) return treeMovementReasonLabel(row.note, t);
    return t(SOURCE_LABEL_KEY[row.source]);
  }

  return (
    <div className="tml">
      {groups.map((group) => (
        <section key={group.key} className="tml-group">
          <header className="tml-month">
            <span className="tml-month-name">{`${months[group.month]} ${group.year}`}</span>
            <span className={group.net < 0 ? 'tml-month-net down' : 'tml-month-net up'}>
              {group.net >= 0 ? '+' : ''}
              {group.net} {unitLabel}
            </span>
          </header>

          {group.rows.map((row) => (
            <article key={row.id} className="tml-row">
              <span className={row.delta < 0 ? 'tml-sign down' : 'tml-sign up'} aria-hidden="true">
                {row.delta < 0 ? '−' : '+'}
              </span>

              <span className="tml-main">
                <span className="tml-title">{title(row)}</span>
                <span className="tml-meta">
                  {row.date
                    ? formatLocalizedIsoDay(row.date, language)
                    : formatLocalizedIsoDateTime(row.createdAt, language)}
                  {row.note && row.source !== 'Manual' ? ` · ${t(SOURCE_LABEL_KEY[row.source])}` : ''}
                </span>
              </span>

              <span className="tml-values">
                <span className={row.delta < 0 ? 'tml-delta down' : 'tml-delta up'}>
                  {row.delta >= 0 ? '+' : ''}
                  {row.delta}
                </span>
                <span className="tml-balance">
                  {row.balance} {unitLabel}
                </span>
              </span>

              {row.source === 'Harvest' ? (
                <span className="tml-spacer" aria-hidden="true" />
              ) : (
                <button
                  type="button"
                  className="tml-delete"
                  onClick={() => onDelete(row)}
                  aria-label={t('common.delete')}
                >
                  ✕
                </button>
              )}
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
