import { KindCatalogField } from '@/components/farm/kind-catalog-field';
import { stockKindImage, stockTypeLabel, STOCK_UNIT_LABEL_KEY, STOCK_UNIT_OPTIONS } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import type { StockFormValues } from './stock-form';
import { STOCK_KIND_CATALOG } from './stock-kind-catalog';
import { StockSeedFields } from './stock-seed-fields';
import { UnitChips } from './unit-chips';

type Props = {
  open: boolean;
  isEditing: boolean;
  values: StockFormValues;
  formError: string | null;
  setField: <K extends keyof StockFormValues>(key: K, value: StockFormValues[K]) => void;
};

export function StockFormFields({ open, isEditing, values, formError, setField }: Props) {
  const { t } = useLanguage();

  return (
    <div className="form-fields">
      {/* An existing stock is settled: a harvest that recorded it is written in the good's own
          terms — its plan reads back this kind and unit, and its results moved the balance by
          that many of them — and the seed it was created with grows into this crop. So an edit
          shows the row back rather than offering to move it under all of that. */}
      {isEditing ? (
        <div className="field">
          <label>{t('farm.type')}</label>
          <span className="limit-hint field-fixed-value">
            <img src={stockKindImage(values.type)} className="kind-chip-icon" alt="" />
            {stockTypeLabel(values.type, t)}
          </span>
        </div>
      ) : (
        /* A dropdown rather than the chip row: the crop catalog is the one users add to most,
           and past a couple of dozen kinds the row filled the modal before the fields below it. */
        <KindCatalogField
          open={open}
          catalog={STOCK_KIND_CATALOG}
          value={values.type}
          onChange={(type) => setField('type', type)}
          /* Only a new stock reaches this branch — an existing one shows its kind back above —
             so there is nothing to preset the catalog to. */
          preset={null}
          labelText={t('farm.type')}
          addPlaceholder={t('farm.newStockTypePlaceholder')}
          variant="dropdown"
          size="large"
          /* Adding a crop type from here is switched off — the catalog is settled, and a type
             invented mid-form lands as a near-duplicate of one already in it. Flip to true to
             bring back both the "New type" button and the add row under a fruitless search. */
          allowAdd={false}
        />
      )}

      {/* The label is how this stock is named everywhere it appears — its plots, its history,
          the harvests that recorded it — so it is settled with the row. */}
      <div className="field">
        <label>{t('farm.name')}</label>
        {isEditing ? (
          <span className="limit-hint field-fixed-value">{values.name.trim() || '—'}</span>
        ) : (
          <input
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder={t('farm.stockNamePlaceholder')}
          />
        )}
      </div>

      {/* How much is on hand is the sum of the movements logged against the stock, so it is
          recorded on its history page rather than typed over here — an edit straight to the
          figure would leave the page and the ledger telling two different stories. */}
      <div className="field">
        <label>{t('farm.amount')}</label>
        {isEditing ? (
          <span className="limit-hint field-fixed-value">{values.amount}</span>
        ) : (
          <input
            type="number"
            step="0.01"
            value={values.amount}
            onChange={(e) => setField('amount', e.target.value)}
            placeholder={t('farm.amountPlaceholder')}
          />
        )}
      </div>

      <div className="field">
        <label>{t('farm.unit')}</label>
        {isEditing ? (
          <span className="limit-hint field-fixed-value">
            {t(STOCK_UNIT_LABEL_KEY[values.unit] ?? 'farm.unitKg')}
          </span>
        ) : (
          <UnitChips options={STOCK_UNIT_OPTIONS} selected={values.unit} onSelect={(unit) => setField('unit', unit)} />
        )}
      </div>

      {!isEditing && (
        <StockSeedFields
          amount={values.seedAmount}
          onAmountChange={(amount) => setField('seedAmount', amount)}
          unit={values.seedUnit}
          onUnitChange={(unit) => setField('seedUnit', unit)}
          stockType={values.type}
        />
      )}

      {formError && <div className="error-banner">{formError}</div>}
    </div>
  );
}
