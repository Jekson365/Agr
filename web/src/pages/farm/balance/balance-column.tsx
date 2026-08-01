import { round2, type ProductBalance } from './product-balance';

type Props = {
  title: string;
  productHeader: string;
  amountHeader: string;
  emptyLabel: string;
  rows: ProductBalance[];
  /* The marketplace half of the table. A column whose produce the marketplace cannot yet take a
     sale for omits all four, and renders as balances alone. */
  listedHeader?: string;
  /** How much of this product is on the marketplace right now, or 0. */
  listedFor?: (row: ProductBalance) => number;
  sellLabel?: string;
  onSell?: (row: ProductBalance) => void;
};

/** One column of the balances table — a holding and, where the marketplace can take it, what is
 * already listed and a way to list more. */
export function BalanceColumn({
  title,
  productHeader,
  amountHeader,
  listedHeader,
  emptyLabel,
  rows,
  listedFor,
  sellLabel,
  onSell,
}: Props) {
  const sellable = onSell != null && listedFor != null;

  return (
    <section className="balance-column">
      <h2 className="balance-column-title">{title}</h2>
      <table className="balance-table">
        <thead>
          <tr>
            <th>{productHeader}</th>
            <th className="balance-amount">{amountHeader}</th>
            {sellable && <th className="balance-amount">{listedHeader}</th>}
            {sellable && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={sellable ? 4 : 2}>{emptyLabel}</td>
            </tr>
          ) : (
            rows.map((item) => {
              const listed = sellable ? listedFor(item) : 0;
              return (
                <tr key={item.key}>
                  <td>{item.title}</td>
                  <td className="balance-amount">
                    {round2(item.balance)} {item.unitLabel}
                  </td>
                  {sellable && (
                    <td className="balance-amount balance-listed">
                      {listed > 0 ? `${round2(listed)} ${item.unitLabel}` : '—'}
                    </td>
                  )}
                  {sellable && (
                    <td className="balance-sell-cell">
                      {/* Nothing on hand, nothing to offer. */}
                      <button type="button" className="balance-sell" disabled={item.balance <= 0} onClick={() => onSell(item)}>
                        {sellLabel}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </section>
  );
}
