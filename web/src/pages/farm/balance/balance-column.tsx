import { useLanguage } from '@/contexts/language-context';
import { round2, type ProductBalance } from './product-balance';
import './balance-cards.css';

type Props = {
  amountHeader: string;
  emptyLabel: string;
  rows: ProductBalance[];
  /* What the marketplace already holds of this produce. Both are omitted for produce the
     marketplace has no category for, which renders as balances alone. */
  listedHeader?: string;
  /** How much of this product is on the marketplace right now, or 0. */
  listedFor?: (row: ProductBalance) => number;
  /** The quality bands the good has been graded into. The amounts behind them are a split of what
   *  the harvests graded rather than of the balance above, so the bands are named without one. */
  bandsFor?: (row: ProductBalance) => string[];
  /** The produce's own artwork, for the holdings whose catalog has any. A balance row carries the
   *  key rather than the kind behind it, so the page that knows the catalog resolves it. */
  iconFor?: (row: ProductBalance) => string | undefined;
  /** The kind under a row whose title is a name the owner gave it — omitted where the title
   *  already is the kind, so it never restates the line above it. */
  captionFor?: (row: ProductBalance) => string | undefined;
};

/** One holding's balances as a card apiece, and where the marketplace knows the produce, how much
 * of it is already listed. Which holding this is comes from the tab that opened it, so a card
 * carries the figures alone rather than naming itself a second time. */
export function BalanceColumn({
  amountHeader,
  listedHeader,
  emptyLabel,
  rows,
  listedFor,
  bandsFor,
  iconFor,
  captionFor,
}: Props) {
  const { t } = useLanguage();
  const showListed = listedFor != null;

  if (rows.length === 0) {
    return <p className="balance-column-empty">{emptyLabel}</p>;
  }

  return (
    <section className="balance-cards">
      {rows.map((item) => {
        const listed = showListed ? listedFor(item) : 0;
        // Nothing on hand: still a product of this farm, so it keeps its card, but it is not what
        // the page is being read for.
        const held = item.balance > 0;
        const bands = bandsFor?.(item) ?? [];
        const icon = iconFor?.(item);
        const caption = captionFor?.(item);
        const cardClass = ['balance-card', held ? '' : 'is-empty', item.removed ? 'is-removed' : '']
          .filter(Boolean)
          .join(' ');

        return (
          <article key={item.key} className={cardClass}>
            <div className="balance-card-head">
              {icon && (
                <span className="balance-card-icon">
                  <img src={icon} alt="" />
                </span>
              )}

              <span className="balance-card-text">
                <span className="balance-card-title">
                  {item.title}
                  {/* Only shown once the removed holdings are asked for, so it marks the cards that
                      are not part of what the farm keeps today rather than labelling everything
                      else by omission. */}
                  {item.removed && <span className="balance-removed-chip">{t('balance.removed')}</span>}
                </span>
                {caption && <span className="balance-card-kind">{caption}</span>}
              </span>
            </div>

            <div className="balance-card-figure">
              <span className="balance-card-label">{amountHeader}</span>
              <span className="balance-card-value">
                {round2(item.balance)}
                <span className="balance-unit">{item.unitLabel}</span>
              </span>
            </div>

            {showListed && (
              <div className="balance-card-row">
                <span className="balance-card-label">{listedHeader}</span>
                {listed > 0 ? (
                  <span className="balance-listed-chip">
                    {round2(listed)}
                    <span className="balance-unit">{item.unitLabel}</span>
                  </span>
                ) : (
                  <span className="balance-card-none">—</span>
                )}
              </div>
            )}

            {bands.length > 0 && (
              <div className="balance-card-row">
                <span className="balance-card-label">{t('balance.colQuality')}</span>
                <span className="balance-card-bands">
                  {bands.map((band) => (
                    <span key={band} className={`balance-band balance-band-${band.toLowerCase()}`}>
                      {band}
                    </span>
                  ))}
                </span>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
