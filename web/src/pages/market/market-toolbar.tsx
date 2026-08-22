import { FilterIcon, SearchIcon } from '@/components/icons/misc-icons';
import { CurrencyToggle } from '@/components/ui/currency-toggle';
import { LISTING_CATEGORY_OPTIONS } from '@/config/market-listing';
import { useLanguage } from '@/contexts/language-context';
import type { ListingCategory } from '@/types/market-listing';

type Props = {
  /** What the account trades under, or null when it has not registered to sell. */
  sellerName: string | null;
  onOpenSeller: () => void;
  onAdd: () => void;
  search: string;
  onSearch: (search: string) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  category: ListingCategory | null;
  onCategory: (category: ListingCategory | null) => void;
};

export function MarketToolbar({
  sellerName,
  onOpenSeller,
  onAdd,
  search,
  onSearch,
  filtersOpen,
  onToggleFilters,
  category,
  onCategory,
}: Props) {
  const { t } = useLanguage();

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{t('market.tabMine')}</h1>
        <div className="page-header-actions">
          <CurrencyToggle />
          {sellerName != null && (
            <button type="button" className="btn btn-secondary market-seller-button" onClick={onOpenSeller}>
              {sellerName || t('seller.shop')}
            </button>
          )}
          <button type="button" className="add-button" onClick={onAdd}>
            + {t(sellerName != null ? 'market.add' : 'seller.register')}
          </button>
        </div>
      </div>

      <div className="search-row">
        <label className="search-field">
          <SearchIcon width={18} height={18} />
          <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={t('market.searchPlaceholder')} />
        </label>
        <button
          type="button"
          className={filtersOpen ? 'filter-toggle active' : 'filter-toggle'}
          onClick={onToggleFilters}
          aria-label={t('market.categoryLabel')}
        >
          <FilterIcon width={18} height={18} />
        </button>
      </div>

      {filtersOpen && (
        <div className="filter-row">
          <button type="button" className={category == null ? 'kind-chip active' : 'kind-chip'} onClick={() => onCategory(null)}>
            <span>{t('market.categoryAll')}</span>
          </button>
          {LISTING_CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={category === opt.value ? 'kind-chip active' : 'kind-chip'}
              onClick={() => onCategory(opt.value)}
            >
              <span>{t(opt.labelKey)}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
