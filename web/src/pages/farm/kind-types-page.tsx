import { useState } from 'react';
import { Link } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import { KindCatalogField, type KindCatalog } from '@/components/farm/kind-catalog-field';
import { LIVESTOCK_KIND_CATALOG } from '@/components/farm/livestock/livestock-kind-catalog';
import { STOCK_KIND_CATALOG } from '@/components/farm/stock/stock-form/stock-kind-catalog';
import { FRUIT_KIND_CATALOG } from '@/components/farm/tree-stock/tree-stock-form/fruit-kind-catalog';
import { useLanguage } from '@/contexts/language-context';

/**
 * One section per catalog. The field owns the loading, the duplicate rules and the delete guards
 * already — it is the same component the stock, fruit and livestock forms use — so a section is
 * the catalog plus a heading.
 *
 * `value` is held here only because the field is a picker: on a form the selection is what gets
 * saved, and here it is just the row last touched. Nothing reads it.
 */
function CatalogSection({ catalog, title, addPlaceholder }: { catalog: KindCatalog; title: string; addPlaceholder: string }) {
  const [selected, setSelected] = useState('');

  return (
    <section className="kind-types-section">
      <KindCatalogField
        open
        catalog={catalog}
        value={selected}
        onChange={setSelected}
        preset={null}
        labelText={title}
        addPlaceholder={addPlaceholder}
        variant="chips"
      />
    </section>
  );
}

/**
 * The three kind catalogs in one place: what types the farm can record stock, fruit and livestock
 * under, each with the picture it is drawn with everywhere in the app.
 *
 * The same types can be added and removed from the forms themselves — this page is where they can
 * be seen together, which is the part the forms cannot do. Offered to one account only; see
 * `CATALOG_ADMIN_EMAIL` and `OwnerRoute` for what that gate is and is not.
 */
export function KindTypesPage() {
  const { t } = useLanguage();

  return (
    <div>
      <Link to="/farm" className="back-link">
        ← {t('farm.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('kindTypes.title')}</h1>
      </div>

      <p className="limit-hint">{t('kindTypes.intro')}</p>

      {/* Each section reuses the placeholder its own form already uses, so the wording a user
          meets here is the wording they meet when adding a type mid-form. */}
      <CatalogSection
        catalog={STOCK_KIND_CATALOG}
        title={t('farm.plantStock')}
        addPlaceholder={t('farm.newStockTypePlaceholder')}
      />
      <CatalogSection
        catalog={FRUIT_KIND_CATALOG}
        title={t('farm.fruits')}
        addPlaceholder={t('treeStock.newFruitTypePlaceholder')}
      />
      <CatalogSection
        catalog={LIVESTOCK_KIND_CATALOG}
        title={t('farm.livestock')}
        addPlaceholder={t('farm.newLivestockTypePlaceholder')}
      />
    </div>
  );
}
