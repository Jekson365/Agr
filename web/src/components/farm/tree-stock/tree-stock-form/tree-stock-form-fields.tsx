import { KindCatalogField } from '@/components/farm/kind-catalog-field';
import { fruitKindImage, fruitTypeLabel, TREE_STOCK_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { useLanguage } from '@/contexts/language-context';
import { FRUIT_KIND_CATALOG } from './fruit-kind-catalog';
import type { TreeStockFormValues } from './tree-stock-form';

type Props = {
  open: boolean;
  isEditing: boolean;
  values: TreeStockFormValues;
  formError: string | null;
  setField: <K extends keyof TreeStockFormValues>(key: K, value: TreeStockFormValues[K]) => void;
};

export function TreeStockFormFields({ open, isEditing, values, formError, setField }: Props) {
  const { t } = useLanguage();

  return (
    <div className="form-fields">
      {/* The fruit is what the orchard's product and its picked-tree history hang off, so it is
          settled when the row is created — an existing one shows its kind rather than offering
          to move the orchard to another fruit. */}
      {isEditing ? (
        <div className="field">
          <label>{t('farm.type')}</label>
          <span className="limit-hint field-fixed-value">
            <img src={fruitKindImage(values.type)} className="kind-chip-icon" alt="" />
            {fruitTypeLabel(values.type, t)}
          </span>
        </div>
      ) : (
        /* A dropdown rather than the chip row, as on the stock and livestock forms: one field
           tall with a search box, so the fruit catalog can grow without pushing the fields
           below it off the modal. */
        <KindCatalogField
          open={open}
          catalog={FRUIT_KIND_CATALOG}
          value={values.type}
          onChange={(type) => setField('type', type)}
          preset={null}
          labelText={t('farm.type')}
          addPlaceholder={t('treeStock.newFruitTypePlaceholder')}
          variant="dropdown"
          size="large"
          /* Adding a fruit from here is switched off — the catalog is settled, and a fruit
             invented mid-form lands as a near-duplicate of one already in it. Flip to true to
             bring back both the "New type" button and the add row under a fruitless search. */
          allowAdd={false}
        />
      )}

      {/* The label is how this orchard is named everywhere it appears — its plot, its history,
          the harvests that picked it — so it is settled with the row rather than moved under
          them afterwards. */}
      <div className="field">
        <label>{t('farm.name')}</label>
        {isEditing ? (
          <span className="limit-hint field-fixed-value">{values.name.trim() || '—'}</span>
        ) : (
          <input
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder={t('treeStock.namePlaceholder')}
          />
        )}
      </div>

      {/* How many trees stand today is the sum of the movements logged against the orchard, so it
          is recorded on its history page rather than typed over here — an edit straight to the
          figure would leave the page and the ledger telling two different stories. */}
      <div className="field">
        <label>{t('treeStock.treeCount')}</label>
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

      {/* Fruit is counted in trees, so the unit isn't a choice — just shown for confirmation. */}
      <div className="field">
        <label>{t('farm.unit')}</label>
        <span className="limit-hint">{t(TREE_STOCK_UNIT_LABEL_KEY[values.unit] ?? 'farm.unitPlant')}</span>
      </div>

      {isEditing && (
        <div className="field">
          <label>{t('treeProduct.producesLabel')}</label>
          <span className="limit-hint field-fixed-value">{values.produce || '—'}</span>
        </div>
      )}

      {formError && <div className="error-banner">{formError}</div>}
    </div>
  );
}
