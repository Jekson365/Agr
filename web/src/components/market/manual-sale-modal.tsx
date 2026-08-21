import { useEffect, useState } from 'react';

import { DateField } from '@/components/ui/date-field';
import { todayIsoDate } from '@/components/ui/date-utils';
import { Modal } from '@/components/ui/modal';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { createManualSale } from '@/services/market-sale-service';
import type { ListingCategory } from '@/types/market-listing';
import type { MarketSale } from '@/types/market-sale';
import type { ListingSource } from './listing-source-options';
import { ListingSourcePicker } from './listing-source-picker';

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (sale: MarketSale) => void;
};

export function ManualSaleModal({ open, onClose, onSaved }: Props) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  const [source, setSource] = useState<ListingSource | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [unitInput, setUnitInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [soldOn, setSoldOn] = useState(todayIsoDate());
  const [buyerName, setBuyerName] = useState('');
  const [buyerSurname, setBuyerSurname] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSource(null);
    setTitleInput('');
    setUnitInput('');
    setQuantityInput('');
    setPriceInput('');
    setSoldOn(todayIsoDate());
    setBuyerName('');
    setBuyerSurname('');
    setBuyerPhone('');
    setError(null);
  }, [open]);

  function applySource(next: ListingSource | null) {
    setSource(next);
    if (!next) return;
    setTitleInput(next.label);
    setUnitInput(next.unitLabel);
  }

  const trimmedTitle = titleInput.trim();
  const quantity = Math.max(0, parseFloat(quantityInput) || 0);
  const price = Math.max(0, parseFloat(priceInput) || 0);
  const total = Math.round(quantity * price * 100) / 100;
  const overAvailable = source != null && quantity > source.amount;
  const canSave = trimmedTitle !== '' && quantity > 0 && !overAvailable && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await createManualSale({
        sourceKind: source?.kind ?? null,
        sourceId: source?.id ?? null,
        sourceUnitId: source?.unitId ?? null,
        itemTitle: trimmedTitle,
        itemType: source?.itemType ?? '',
        itemCategory: (source?.category ?? 'Other') as ListingCategory,
        priceUnit: unitInput.trim(),
        quantity,
        price,
        soldOn: soldOn || null,
        buyerName: buyerName.trim(),
        buyerSurname: buyerSurname.trim(),
        buyerPhone: buyerPhone.trim(),
      });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409 ? t('sales.notEnoughStock') : t('sales.manualSaveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="wide">
      <h2 className="form-title">{t('sales.manualTitle')}</h2>

      <div className="form-fields modal-form-grid">
        <ListingSourcePicker selected={source} onSelect={applySource} />

        <div className="field field-full">
          <label>{t('sales.manualItem')}</label>
          <input
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder={t('sales.manualItemPlaceholder')}
          />
          <span className="limit-hint">{t('sales.manualItemHint')}</span>
        </div>

        <div className="field">
          <label>{t('sales.manualQuantity')}</label>
          <input value={quantityInput} onChange={(e) => setQuantityInput(e.target.value)} inputMode="decimal" />
          {source && (
            <span className={overAvailable ? 'limit-hint listing-quantity-over' : 'limit-hint'}>
              {t('market.availableToSell', { amount: source.amount, unit: source.unitLabel })}
            </span>
          )}
        </div>

        <div className="field">
          <label>{t('sales.manualUnit')}</label>
          <input
            value={unitInput}
            onChange={(e) => setUnitInput(e.target.value)}
            placeholder={t('market.priceUnitPlaceholder')}
          />
        </div>

        <div className="field">
          <label>{t('sales.manualPrice')}</label>
          <input value={priceInput} onChange={(e) => setPriceInput(e.target.value)} inputMode="decimal" />
          {total > 0 && <span className="limit-hint">{t('sales.manualTotal', { total: formatPrice(total) })}</span>}
        </div>

        <div className="field">
          <label>{t('sales.manualDate')}</label>
          <DateField value={soldOn} max={todayIsoDate()} onChange={(v) => setSoldOn(v ?? '')} />
        </div>

        <div className="field">
          <label>{t('sales.manualBuyerName')}</label>
          <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
        </div>

        <div className="field">
          <label>{t('sales.manualBuyerSurname')}</label>
          <input value={buyerSurname} onChange={(e) => setBuyerSurname(e.target.value)} />
        </div>

        <div className="field field-full">
          <label>{t('sales.manualBuyerPhone')}</label>
          <input type="tel" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} />
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" onClick={handleSave} disabled={!canSave}>
          {t('common.save')}
        </button>
      </div>
    </Modal>
  );
}
