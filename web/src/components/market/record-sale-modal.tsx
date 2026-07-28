import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { fruitTypeLabel, TREE_STOCK_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { listingItemLabel } from '@/config/market-listing';
import { PRODUCTION_TYPE_LABEL_KEY, UNIT_LABEL_KEY } from '@/config/production';
import { STOCK_UNIT_LABEL_KEY, stockTypeLabel } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { getAllAnimalProductions } from '@/services/animal-production-service';
import { getProductionMovements, recordProductionSale } from '@/services/production-movement-service';
import { getProductionTypes } from '@/services/production-type-service';
import { getStock, recordStockSale } from '@/services/stock-service';
import { getTreeProductBalances, getTreeProducts, recordTreeProductSale } from '@/services/tree-product-service';
import { getTreeStock, recordTreeStockSale } from '@/services/tree-stock-service';
import { getUnits } from '@/services/unit-service';
import { TREE_PRODUCT_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import type { MarketListing } from '@/types/market-listing';

/**
 * Where a sale is deducted from, resolved from the listing itself. `production` targets a
 * type/unit balance; the other two target one inventory row.
 */
type SaleSource = {
  kind: 'stock' | 'tree' | 'production' | 'treeProduct';
  /** Stock/tree stock/tree product row id; unused for production. */
  id: number;
  productionTypeId?: number;
  unitId?: number;
  label: string;
  amount: number;
  unitLabel: string;
};

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

    async function resolveSource() {
      if (!current) return;
      setLoading(true);
      setError(null);
      setSource(null);
      setQuantityInput(current.quantity != null ? String(current.quantity) : '');
      try {
        const resolved =
          current.category === 'Stock'
            ? await stockSource(current.itemType, current.title)
            : current.category === 'TreeStock'
              ? await treeStockSource(current.itemType, current.title)
              : current.category === 'TreeProduct'
                ? await treeProductSource(current.itemType, current.title)
                : // Anything else may still come out of a production balance (milk, eggs…) or,
                  // failing that, a stock item of the same kind.
                  ((await productionSource(current.itemType)) ?? (await stockSource(current.itemType, current.title)));
        if (cancelled) return;

        setSource(resolved);
        if (resolved && current.quantity != null) {
          setQuantityInput(String(Math.min(current.quantity, resolved.amount)));
        }
      } catch {
        if (!cancelled) setError(t('market.recordSaleError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    /** Among rows of the listing's kind, the one named like the listing, else the fullest. */
    function bestOf(candidates: SaleSource[], title: string): SaleSource | null {
      if (candidates.length === 0) return null;
      const wanted = title.trim().toLowerCase();
      return (
        candidates.find((c) => c.label.toLowerCase() === wanted) ??
        candidates.reduce((best, c) => (c.amount > best.amount ? c : best))
      );
    }

    async function stockSource(itemType: string, title: string): Promise<SaleSource | null> {
      const rows = (await getStock())
        .filter((s) => s.type === itemType)
        .map<SaleSource>((s) => ({
          kind: 'stock',
          id: s.id,
          label: s.name.trim() || stockTypeLabel(s.type, t),
          amount: s.amount,
          unitLabel: t(STOCK_UNIT_LABEL_KEY[s.unit]),
        }));
      return bestOf(rows, title);
    }

    async function treeStockSource(itemType: string, title: string): Promise<SaleSource | null> {
      const rows = (await getTreeStock())
        .filter((s) => s.type === itemType)
        .map<SaleSource>((s) => ({
          kind: 'tree',
          id: s.id,
          label: s.name.trim() || fruitTypeLabel(s.type, t),
          amount: s.amount,
          unitLabel: t(TREE_STOCK_UNIT_LABEL_KEY[s.unit]),
        }));
      return bestOf(rows, title);
    }

    /** The fruit product the listing names, and its balance on hand from the movement ledger. */
    async function treeProductSource(itemType: string, title: string): Promise<SaleSource | null> {
      const [productList, balances] = await Promise.all([getTreeProducts(), getTreeProductBalances()]);
      const rows = productList
        .filter((p) => p.name === itemType || p.name === title.trim())
        .map<SaleSource>((p) => ({
          kind: 'treeProduct',
          id: p.id,
          label: p.name,
          amount: balances.get(p.id) ?? 0,
          unitLabel: t(TREE_PRODUCT_UNIT_LABEL_KEY[p.unit] ?? 'farm.unitKg'),
        }));
      return bestOf(rows, title);
    }

    /** The balance of the production type the listing names: collected plus movements. */
    async function productionSource(itemType: string): Promise<SaleSource | null> {
      const types = await getProductionTypes();
      const type = types.find((pt) => pt.name === itemType);
      if (!type) return null;

      const [records, movements, units] = await Promise.all([
        getAllAnimalProductions(),
        getProductionMovements(),
        getUnits(),
      ]);

      // A type can be collected in more than one unit, and those balances are separate; the
      // sale applies to the unit the most was collected in.
      const byUnit = new Map<number, number>();
      for (const record of records) {
        if (record.productionTypeId !== type.id) continue;
        byUnit.set(record.unitId, (byUnit.get(record.unitId) ?? 0) + record.quantity);
      }
      if (byUnit.size === 0) return null;
      for (const movement of movements) {
        if (movement.productionTypeId !== type.id) continue;
        if (byUnit.has(movement.unitId)) byUnit.set(movement.unitId, byUnit.get(movement.unitId)! + movement.delta);
      }

      const [unitId, amount] = [...byUnit.entries()].reduce((best, entry) => (entry[1] > best[1] ? entry : best));
      const unit = units.find((u) => u.id === unitId);
      return {
        kind: 'production',
        id: type.id,
        productionTypeId: type.id,
        unitId,
        label: t(PRODUCTION_TYPE_LABEL_KEY[type.name] ?? type.name),
        amount,
        unitLabel: unit ? t(UNIT_LABEL_KEY[unit.name] ?? unit.name) : '',
      };
    }

    resolveSource();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, listing]);

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
      if (source.kind === 'production') {
        await recordProductionSale(source.productionTypeId!, source.unitId!, quantity, listing.id);
      } else if (source.kind === 'treeProduct') {
        await recordTreeProductSale(source.id, quantity);
      } else if (source.kind === 'tree') {
        await recordTreeStockSale(source.id, quantity, listing.id);
      } else {
        await recordStockSale(source.id, quantity, listing.id);
      }
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
