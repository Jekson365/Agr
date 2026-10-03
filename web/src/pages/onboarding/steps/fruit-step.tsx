import { KindCatalogField } from '@/components/farm/kind-catalog-field';
import { FRUIT_KIND_CATALOG } from '@/components/farm/tree-stock/tree-stock-form/fruit-kind-catalog';
import { useLanguage } from '@/contexts/language-context';
import type { FruitDraft } from '../onboarding-draft';

type Props = {
  value: FruitDraft;
  onChange: (next: FruitDraft) => void;
};

export function FruitStep({ value, onChange }: Props) {
  const { t } = useLanguage();

  return (
    <div className="onboarding-step">
      <div className="onboarding-fields">
        <KindCatalogField
          open
          catalog={FRUIT_KIND_CATALOG}
          value={value.type}
          onChange={(type) => onChange({ ...value, type })}
          preset={null}
          labelText={t('farm.type')}
          addPlaceholder={t('treeStock.newFruitTypePlaceholder')}
          variant="dropdown"
          size="large"
          allowAdd={false}
        />

        <div className="field">
          <label>{t('farm.name')}</label>
          <input
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder={t('treeStock.namePlaceholder')}
          />
        </div>

        <div className="field">
          <label>{t('treeStock.treeCount')}</label>
          <input
            type="number"
            step="1"
            min="0"
            value={value.amount}
            onChange={(e) => onChange({ ...value, amount: e.target.value })}
            placeholder={t('farm.amountPlaceholder')}
          />
        </div>
      </div>
    </div>
  );
}
