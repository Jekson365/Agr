import { useEffect, useState } from 'react';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import '@/components/farm/search-filter.css';
import { ListingFormModal } from '@/components/market/listing-form-modal';
import { MarketListingCard } from '@/components/market/market-listing-card';
import { RecordSaleModal } from '@/components/market/record-sale-modal';
import { SellerRegistrationModal } from '@/components/market/seller-registration-modal';
import { MarketToolbar } from '@/pages/market/market-toolbar';
import { useListingSales } from '@/pages/market/use-listing-sales';
import { listingItemLabel } from '@/config/market-listing';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { requestPremium } from '@/services/admin-service';
import { deleteMarketListing, getMarketListings } from '@/services/market-listing-service';
import type { ListingCategory, MarketListing } from '@/types/market-listing';
import './market-page.css';

export function MarketPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [category, setCategory] = useState<ListingCategory | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<MarketListing | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  const [sellerOpen, setSellerOpen] = useState(false);

  const { saleListing, setSaleListing, handleSoldClick, handleSaleRecorded } = useListingSales(setListings, setError);

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

  const isSeller = user?.isSeller === true;

  /* Selling asks for a registration first — the server refuses a listing from an account that
     has none, so the form would only fail. Nothing here gates buying. */
  function openAdd() {
    if (!isSeller) {
      setSellerOpen(true);
      return;
    }
    setEditingListing(null);
    setFormOpen(true);
  }

  function openEdit(item: MarketListing) {
    setEditingListing(item);
    setFormOpen(true);
  }

  /** Asks an operator to promote a listing. Recorded, not granted — approval happens in /manager. */
  async function askForPremium(id: number) {
    try {
      await requestPremium(id);
      // Patched rather than refetched, like every other mutation on this page. Only the presence
      // of the timestamp is read, never its value, so the client's clock is honest enough.
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, premiumRequestedAt: new Date().toISOString() } : l))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
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

  return (
    <div className="page-fill market-page">
      <div className="page-fill-header">
        <MarketToolbar
          sellerName={isSeller ? (user?.sellerName ?? '') : null}
          onOpenSeller={() => setSellerOpen(true)}
          onAdd={openAdd}
          search={search}
          onSearch={setSearch}
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((prev) => !prev)}
          category={category}
          onCategory={setCategory}
        />

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
            {visibleListings.map((item) => (
              <MarketListingCard
                key={item.id}
                item={item}
                onEdit={() => openEdit(item)}
                onDelete={(name) => setConfirmDelete({ id: item.id, name })}
                onToggleSold={() => handleSoldClick(item)}
                onRequestPremium={
                  item.isPremium || item.premiumRequestedAt ? undefined : () => askForPremium(item.id)
                }
              />
            ))}
          </div>
        )}
      </div>

      <SellerRegistrationModal
        open={sellerOpen}
        onClose={() => setSellerOpen(false)}
        onRegistered={() => {
          setEditingListing(null);
          setFormOpen(true);
        }}
      />

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
