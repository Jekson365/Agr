import { useLanguage } from '@/contexts/language-context';
import { round2, type ProductBalance } from './product-balance';

type Props = {
  productHeader: string;
  amountHeader: string;
  emptyLabel: string;
  rows: ProductBalance[];
  /* What the marketplace already holds of this produce. Both are omitted for produce the
     marketplace has no category for, which renders as balances alone. */
  listedHeader?: string;
  /** How much of this product is on the marketplace right now, or 0. */
  listedFor?: (row: ProductBalance) => number;
};

/** One holding's balances, and where the marketplace knows the produce, how much of it is already
 * listed. Which holding this is comes from the tab that opened it, so the card carries the figures
 * alone rather than naming itself a second time. */
export function BalanceColumn({ productHeader, amountHeader, listedHeader, emptyLabel, rows, listedFor }: Props) {
  const { t } = useLanguage();
  const showListed = listedFor != null;

  return (
    <section className="balance-column">
      {rows.length === 0 ? (
        /* Column labels over an empty body read as a table that failed to load; the line on its
           own reads as a holding that is simply empty. */
        <p className="balance-column-empty">{emptyLabel}</p>
      ) : (
        <table className="balance-table">
          <thead>
            <tr>
              <th>{productHeader}</th>
              <th className="balance-amount">{amountHeader}</th>
              {showListed && <th className="balance-amount">{listedHeader}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const listed = showListed ? listedFor(item) : 0;
              // Nothing on hand: still a product of this farm, so it keeps its row, but it is not
              // what the table is being read for.
              const held = item.balance > 0;
              return (
                <tr key={item.key} className={held ? undefined : 'balance-row-empty'}>
                  <td>
                    {item.title}
                    {/* Only shown once the removed holdings are asked for, so it marks the rows
                        that are not part of what the farm keeps today rather than labelling
                        everything else by omission. */}
                    {item.removed && <span className="balance-removed-chip">{t('balance.removed')}</span>}
                  </td>
                  <td className="balance-amount">
                    {round2(item.balance)}
                    <span className="balance-unit">{item.unitLabel}</span>
                  </td>
                  {showListed && (
                    <td className="balance-amount balance-listed">
                      {listed > 0 ? (
                        <span className="balance-listed-chip">
                          {round2(listed)}
                          <span className="balance-unit">{item.unitLabel}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
