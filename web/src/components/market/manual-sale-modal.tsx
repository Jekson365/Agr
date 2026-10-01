import { useEffect, useState } from 'react';

import './manual-sale-modal.css';

import { DateField } from '@/components/ui/date-field';
import { todayIsoDate } from '@/components/ui/date-utils';
import { Modal } from '@/components/ui/modal';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { createManualSale } from '@/services/market-sale-service';
import type { ListingCategory, ListingSourceKind } from '@/types/market-listing';
import type { MarketSale } from '@/types/market-sale';
import type { SaleAnimal } from '@/types/sale-animal';
import type { ListingSource } from './listing-source-options';
import { ListingSourcePicker } from './listing-source-picker';
import { ManualSaleBuyerFields, type SaleBuyer } from './manual-sale-buyer-fields';
import { SaleAnimalPicker } from './sale-animal-picker';
import { animalSaleItemType, animalSaleTitle } from './sale-animals';

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (sale: MarketSale) => void;
};

const ANIMAL_KINDS: ListingSourceKind[] = ['Livestock'];
const NO_BUYER: SaleBuyer = { name: '', surname: '', phone: '' };

export function ManualSaleModal({ open, onClose, onSaved }: Props) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  const [kind, setKind] = useState<ListingSourceKind | null>(null);
  const [source, setSource] = useState<ListingSource | null>(null);
  const [animals, setAnimals] = useState<SaleAnimal[]>([]);
  const [titleInput, setTitleInput] = useState('');
  const [unitInput, setUnitInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [soldOn, setSoldOn] = useState(todayIsoDate());
  const [buyer, setBuyer] = useState<SaleBuyer>(NO_BUYER);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setKind(null);
    setSource(null);
    setAnimals([]);
    setTitleInput('');
    setUnitInput('');
    setQuantityInput('');
    setPriceInput('');
    setSoldOn(todayIsoDate());
    setBuyer(NO_BUYER);
    setError(null);
  }, [open]);

  function applySource(next: ListingSource | null) {
    setSource(next);
    if (!next) return;
    setTitleInput(next.label);
    setUnitInput(next.unitLabel);
  }

  function changeKind(next: ListingSourceKind | null) {
    setKind(next);
    setAnimals([]);
    if (next === 'Livestock') setUnitInput(t('balance.unitHead'));
  }

  function pickAnimals(next: SaleAnimal[]) {
    setAnimals(next);
    setTitleInput(animalSaleTitle(next, t));
  }

  const byAnimal = kind === 'Livestock';
  const trimmedTitle = titleInput.trim();
  const quantity = byAnimal ? animals.length : Math.max(0, parseFloat(quantityInput) || 0);
  const price = Math.max(0, parseFloat(priceInput) || 0);
  const total = Math.round(quantity * price * 100) / 100;
  const overAvailable = !byAnimal && source != null && quantity > source.amount;
  const canSave = trimmedTitle !== '' && quantity > 0 && !overAvailable && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await createManualSale({
        sourceKind: byAnimal ? 'Livestock' : (source?.kind ?? null),
        sourceId: byAnimal ? null : (source?.id ?? null),
        sourceUnitId: byAnimal ? null : (source?.unitId ?? null),
        itemTitle: trimmedTitle,
        itemType: byAnimal ? animalSaleItemType(animals) : (source?.itemType ?? ''),
        itemCategory: (byAnimal ? 'Livestock' : (source?.category ?? 'Other')) as ListingCategory,
        priceUnit: unitInput.trim(),
        quantity,
        price,
        animalIds: byAnimal ? animals.map((animal) => animal.id) : [],
        soldOn: soldOn || null,
        buyerName: buyer.name.trim(),
        buyerSurname: buyer.surname.trim(),
        buyerPhone: buyer.phone.trim(),
      });
      onSaved(saved);
      onClose();
    } catch (err) {
      const conflict = err instanceof ApiError && err.status === 409;
      setError(conflict ? t(byAnimal ? 'sales.animalsUnavailable' : 'sales.notEnoughStock') : t('sales.manualSaveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="xwide" className="manual-sale-modal">
      <h2 className="form-title">{t('sales.manualTitle')}</h2>

      <div className="sale-form-grid">
        <ListingSourcePicker
          selected={source}
          onSelect={applySource}
          onKindChange={changeKind}
          customKinds={ANIMAL_KINDS}
        />

        {byAnimal && <SaleAnimalPicker selected={animals} onChange={pickAnimals} />}

        <div className="field field-wide">
          <label>{t('sales.manualItem')}</label>
          <input
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder={t('sales.manualItemPlaceholder')}
          />
          <span className="limit-hint">{t('sales.manualItemHint')}</span>
        </div>

        <div className="field">
          <label>{t('sales.manualDate')}</label>
          <DateField value={soldOn} max={todayIsoDate()} onChange={(v) => setSoldOn(v ?? '')} />
        </div>

        <div className="field">
          <label>{t('sales.manualQuantity')}</label>
          <input
            value={byAnimal ? String(animals.length) : quantityInput}
            onChange={(e) => setQuantityInput(e.target.value)}
            readOnly={byAnimal}
            inputMode="decimal"
          />
          {source && !byAnimal && (
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

        <ManualSaleBuyerFields buyer={buyer} onChange={setBuyer} />
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
