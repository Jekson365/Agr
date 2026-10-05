import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { listingItemLabel } from '@/config/market-listing';
import { useLanguage } from '@/contexts/language-context';
import type { MarketListing } from '@/types/market-listing';
import { recordSale, resolveSaleSource, type SaleSource } from './record-sale-sources';

type Props = {
  open: boolean;
  /** The listing being sold. */
  listing: MarketListing | null;
  /** Backing out — the listing stays active and untouched. */
  onCancel: () => void;
  /** Called after the sale was recorded, with the quantity that was sold. */
  onSold: (quantity: number) => void;
};

/**
 * Opened by the "mark sold" button of a listing: asks only how much was sold and shows what
 * stays on the listing. What the sale comes out of is resolved from the listing's own category
 * and item type — the user is never asked to pick a source. When a match exists the quantity is
 * deducted and logged as a Market movement in that product's history; when nothing matches
 * (equipment, one-off goods) only the listing itself changes. The caller then completes the
 * listing, or keeps it active with the remaining balance after a partial sale.
 */
export function RecordSaleModal({ open, listing, onCancel, onSold }: Props) {
  const { t } = useLanguage();

  const [source, setSource] = useState<SaleSource | null>(null);
  const [quantityInput, setQuantityInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const current = listing;
    if (!open || !current) return;
    let cancelled = false;

    setLoading(true);
    setError(null);
    setSource(null);
    setQuantityInput(current.quantity != null ? String(current.quantity) : '');
    resolveSaleSource(current, t)
      .then((resolved) => {
        if (cancelled) return;
        setSource(resolved);
        if (resolved && current.quantity != null) {
          setQuantityInput(String(Math.min(current.quantity, resolved.amount)));
        }
      })
      .catch(() => {
        if (!cancelled) setError(t('market.recordSaleError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, listing, t]);

  if (!listing) return null;

  const title = listing.title.trim() || listingItemLabel(listing.category, listing.itemType, t);
  const quantity = parseFloat(quantityInput) || 0;
  const overStock = source != null && quantity > source.amount;
  const overListed = listing.quantity != null && quantity > listing.quantity;
  const overAvailable = overStock || overListed;
  const canSave = quantity > 0 && !overAvailable && !saving && !loading;

  // What stays on the listing after this sale — the caller keeps the listing active with it.
  const remaining =
    listing.quantity != null && quantity > 0 && !overAvailable ? Math.max(0, listing.quantity - quantity) : null;
  const remainingUnit = source?.unitLabel ?? listing.priceUnit ?? '';

  async function handleSave() {
    if (!listing || !canSave) return;
    if (source == null) {
      // Nothing on the farm matches this listing — the sale only adjusts the listing itself.
      onSold(quantity);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await recordSale(source, quantity, listing);
      onSold(quantity);
    } catch {
      setError(t('market.recordSaleError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onCancel}>
      <h2 className="form-title">{t('market.recordSaleTitle')}</h2>
      <p className="modal-body-text">{t(source ? 'market.recordSaleBody' : 'market.recordSaleBodySimple', { title })}</p>

      {loading ? (
        <div className="state-box">…</div>
      ) : (
        <div className="form-fields">
          <div className="field">
            <label>{t('market.recordSaleQuantity')}</label>
            <input value={quantityInput} onChange={(e) => setQuantityInput(e.target.value)} inputMode="decimal" autoFocus />

            {/* Read-only: says what the sale will draw down, without asking anything. */}
            {source && (
              <span className={overStock ? 'limit-hint listing-quantity-over' : 'limit-hint'}>
                {source.label} — {t('market.availableToSell', { amount: source.amount, unit: source.unitLabel })}
              </span>
            )}
            {!source && listing.quantity != null && (
              <span className={overListed ? 'limit-hint listing-quantity-over' : 'limit-hint'}>
                {t('market.availableToSell', { amount: listing.quantity, unit: remainingUnit })}
              </span>
            )}
            {remaining != null && (
              <span className="limit-hint">{t('market.recordSaleRemaining', { amount: remaining, unit: remainingUnit })}</span>
            )}
          </div>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" onClick={handleSave} disabled={!canSave}>
          {t('market.recordSaleConfirm')}
        </button>
      </div>
    </Modal>
  );
}
