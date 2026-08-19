import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import '@/components/farm/search-filter.css';
import { EquipmentIcon, FilterIcon, ImagesIcon, SearchIcon, TagIcon } from '@/components/icons/misc-icons';
import { ListingFormModal } from '@/components/market/listing-form-modal';
import { RecordSaleModal } from '@/components/market/record-sale-modal';
import { CurrencyToggle } from '@/components/ui/currency-toggle';
import { LISTING_CATEGORY_OPTIONS, listingImage, listingItemLabel } from '@/config/market-listing';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { deleteMarketListing, getMarketListings, updateMarketListing } from '@/services/market-listing-service';
import type { ListingCategory, MarketListing } from '@/types/market-listing';
import './market-page.css';

export function MarketPage() {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [category, setCategory] = useState<ListingCategory | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<MarketListing | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  const [saleListing, setSaleListing] = useState<MarketListing | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // Always the signed-in user's own listings. Browsing what everyone else is offering lives
      // in the standalone marketplace app now; this page is where you manage your own.
      const result = await getMarketListings({
        category: category ?? undefined,
        mine: true,
      });
      setListings(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const visibleListings = listings.filter((item) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    const label = listingItemLabel(item.category, item.itemType, t).toLowerCase();
    return item.title.toLowerCase().includes(term) || label.includes(term);
  });

  function openAdd() {
    setEditingListing(null);
    setFormOpen(true);
  }

  function openEdit(item: MarketListing) {
    setEditingListing(item);
    setFormOpen(true);
  }

  async function confirmDeleteListing() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteMarketListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  function handleSaved(listing: MarketListing, isNew: boolean) {
    setListings((prev) => (isNew ? [listing, ...prev] : prev.map((l) => (l.id === listing.id ? listing : l))));
  }

  async function updateListing(updated: MarketListing) {
    try {
      await updateMarketListing(updated.id, updated);
      setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function handleSoldClick(item: MarketListing) {
    if (item.status === 'Completed') {
      updateListing({ ...item, status: 'Active' });
      return;
    }
    // Selling own production should show up in the stock's history — the sale modal records
    // the movement and decides whether the listing completes or keeps a remaining balance.
    // Other listings with a quantity get the same sold/remaining split, just without the
    // inventory movement; without a quantity there is nothing to split.
    if (item.category === 'Stock' || item.category === 'TreeStock' || item.quantity != null) {
      setSaleListing(item);
    } else {
      updateListing({ ...item, status: 'Completed' });
    }
  }

  function handleSaleRecorded(soldQuantity: number) {
    if (saleListing) {
      const remaining = saleListing.quantity != null ? saleListing.quantity - soldQuantity : null;
      if (remaining != null && remaining > 0) {
        // Partial sale — the listing stays active with the balance that's still for sale.
        updateListing({ ...saleListing, quantity: remaining });
      } else {
        updateListing({ ...saleListing, status: 'Completed', quantity: remaining != null ? 0 : saleListing.quantity });
      }
    }
    setSaleListing(null);
  }

  return (
    <div className="page-fill market-page">
      <div className="page-fill-header">
        <div className="page-header">
          <h1 className="page-title">{t('market.tabMine')}</h1>
          <div className="page-header-actions">
            <CurrencyToggle />
            <button type="button" className="add-button" onClick={openAdd}>
              + {t('market.add')}
            </button>
          </div>
        </div>

        <div className="search-row">
          <label className="search-field">
            <SearchIcon width={18} height={18} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('market.searchPlaceholder')} />
          </label>
          <button
            type="button"
            className={filtersOpen ? 'filter-toggle active' : 'filter-toggle'}
            onClick={() => setFiltersOpen((prev) => !prev)}
            aria-label={t('market.categoryLabel')}
          >
            <FilterIcon width={18} height={18} />
          </button>
        </div>

        {filtersOpen && (
          <div className="filter-row">
            <button type="button" className={category == null ? 'kind-chip active' : 'kind-chip'} onClick={() => setCategory(null)}>
              <span>{t('market.categoryAll')}</span>
            </button>
            {LISTING_CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={category === opt.value ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setCategory(opt.value)}
              >
                <span>{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>
        )}

      </div>

      <div className="page-fill-scroll">
        {loading ? (
          <div className="state-box">…</div>
        ) : error ? (
          <div className="state-box">
            <span>{t('market.loadError')}</span>
            <button type="button" className="retry-button" onClick={load}>
              {t('common.retry')}
            </button>
          </div>
        ) : visibleListings.length === 0 ? (
          <p className="empty-state">{t('market.emptyMine')}</p>
        ) : (
          <div className="product-grid listing-grid">
            {visibleListings.map((item) => {
              const typeLabel = listingItemLabel(item.category, item.itemType, t);
              const title = item.title.trim() || typeLabel;
              const fallbackImage = listingImage(item.category, item.itemType);
              const coverImage = item.imagePaths[0];
              const isCompleted = item.status === 'Completed';

              return (
                <div key={item.id} className="product-card">
                  <Link to={`/market/${item.id}`} className="listing-card-link">
                    <div className="listing-image-wrap">
                      {coverImage ? (
                        <img src={resolveAssetUrl(coverImage)} alt="" className="product-image" />
                      ) : (
                        <div className="product-image listing-image-fallback">
                          {fallbackImage ? (
                            <img src={fallbackImage} alt="" className="listing-fallback-icon" />
                          ) : item.category === 'Equipment' ? (
                            <EquipmentIcon width={28} height={28} />
                          ) : (
                            <TagIcon width={28} height={28} />
                          )}
                        </div>
                      )}

                      <span className="listing-seller-badge">
                        {item.sellerImagePath && <img src={resolveAssetUrl(item.sellerImagePath)} alt="" />}
                      </span>

                      {item.imagePaths.length > 1 && (
                        <span className="listing-photo-count">
                          <ImagesIcon width={11} height={11} /> {item.imagePaths.length}
                        </span>
                      )}
                    </div>
                    <div className="product-info">
                      <div className="list-card-title">{title}</div>
                      <div className="listing-price">
                        {formatPrice(item.price)}
                        {item.priceUnit ? ` / ${item.priceUnit}` : ''}
                      </div>
                      {item.location && <div className="list-card-subtitle">{item.location}</div>}
                      {!isCompleted && item.quantity != null && item.quantity > 0 && (
                        <div className="listing-balance">
                          {t('market.balanceLeft', { amount: item.quantity, unit: item.priceUnit })}
                        </div>
                      )}
                    </div>
                  </Link>

                  <button
                    type="button"
                    className={isCompleted ? 'listing-sold-badge checked' : 'listing-sold-badge'}
                    onClick={() => handleSoldClick(item)}
                    aria-label={isCompleted ? t('market.markActive') : t('market.markCompleted')}
                  >
                    {isCompleted ? t('market.sold') : t('market.markSold')}
                  </button>

                  <div className="listing-menu">
                    <CardMenu
                      onEdit={() => openEdit(item)}
                      onDelete={() => setConfirmDelete({ id: item.id, name: title })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ListingFormModal open={formOpen} editingListing={editingListing} onClose={() => setFormOpen(false)} onSaved={handleSaved} />

      <RecordSaleModal
        open={saleListing != null}
        listing={saleListing}
        onCancel={() => setSaleListing(null)}
        onSold={handleSaleRecorded}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.name ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteListing}
      />
    </div>
  );
}
