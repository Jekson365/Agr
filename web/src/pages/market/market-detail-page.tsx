import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import { BoxIcon, CalendarIcon, CallIcon, EquipmentIcon, LeafIcon, LocationIcon, PawIcon, PersonIcon, TagIcon } from '@/components/icons/misc-icons';
import { ImageSlider } from '@/components/market/image-slider';
import { LISTING_CATEGORY_LABEL_KEY, listingImage, listingItemLabel } from '@/config/market-listing';
import { useCurrency } from '@/contexts/currency-context';
import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { getMarketListing } from '@/services/market-listing-service';
import type { ListingCategory, MarketListing } from '@/types/market-listing';
import './market-detail-page.css';

function CategoryIcon({ category, ...props }: { category: ListingCategory; width?: number; height?: number }) {
  switch (category) {
    case 'Stock':
    case 'TreeStock':
      return <LeafIcon {...props} />;
    case 'Livestock':
      return <PawIcon {...props} />;
    case 'Equipment':
      return <EquipmentIcon {...props} />;
    default:
      return <TagIcon {...props} />;
  }
}

export function MarketDetailPage() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { id: idParam } = useParams<{ id: string }>();
  const listingId = Number(idParam);

  const [listing, setListing] = useState<MarketListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!listingId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setListing(await getMarketListing(listingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const typeLabel = listing ? listingItemLabel(listing.category, listing.itemType, t) : '';
  const title = listing ? listing.title.trim() || typeLabel : '';
  const fallbackImage = listing ? listingImage(listing.category, listing.itemType) : null;
  const isCompleted = listing?.status === 'Completed';
  const sellerFullName = listing ? [listing.sellerName, listing.sellerSurname].filter(Boolean).join(' ') : '';
  const kindLabel = listing
    ? listing.itemType.trim() !== ''
      ? typeLabel
      : listing.category !== 'Other'
        ? t(LISTING_CATEGORY_LABEL_KEY[listing.category])
        : ''
    : '';

  return (
    <div>
      <Link to="/market" className="back-link">
        ← {t('market.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{title || t('market.title')}</h1>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error || !listing ? (
        <div className="state-box">
          <span>{t('market.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <>
          <div className="listing-hero-wrap">
            {listing.imagePaths.length > 0 ? (
              <ImageSlider images={listing.imagePaths.map(resolveAssetUrl)} />
            ) : (
              <div className="listing-hero-placeholder">
                {fallbackImage ? (
                  <img src={fallbackImage} alt="" className="listing-hero-fallback-icon" />
                ) : (
                  <CategoryIcon category={listing.category} width={56} height={56} />
                )}
              </div>
            )}
            <div className={isCompleted ? 'listing-status-overlay completed' : 'listing-status-overlay'}>
              <span className="listing-status-dot" />
              {isCompleted ? t('market.statusCompleted') : t('market.statusActive')}
            </div>
          </div>

          <h2 className="listing-detail-title">{title}</h2>
          <div className="listing-detail-price-row">
            <span className="listing-detail-price">{formatPrice(listing.price)}</span>
            {listing.priceUnit && <span className="listing-detail-price-unit">/ {listing.priceUnit}</span>}
          </div>

          <div className="listing-meta-row">
            {kindLabel && (
              <span className="listing-meta-chip">
                <CategoryIcon category={listing.category} width={14} height={14} />
                {kindLabel}
              </span>
            )}
            {listing.location && (
              <span className="listing-meta-chip">
                <LocationIcon width={14} height={14} />
                {listing.location}
              </span>
            )}
            {listing.quantity != null && (
              <span className="listing-meta-chip">
                <BoxIcon width={14} height={14} />
                {listing.quantity}
              </span>
            )}
            <span className="listing-meta-chip">
              <CalendarIcon width={14} height={14} />
              {formatLocalizedIsoDate(listing.createdAt, language)}
            </span>
          </div>

          {listing.description && (
            <div className="listing-section">
              <div className="listing-section-label">{t('market.description')}</div>
              <div className="listing-description-card">{listing.description}</div>
            </div>
          )}

          <div className="listing-section">
            <div className="listing-section-label">{t('market.seller')}</div>
            <div className="listing-seller-card">
              <div className="listing-seller-avatar">
                {listing.sellerImagePath ? (
                  <img src={resolveAssetUrl(listing.sellerImagePath)} alt="" />
                ) : (
                  <PersonIcon width={22} height={22} />
                )}
              </div>
              <div className="listing-seller-info">
                <div className="listing-seller-name">{sellerFullName}</div>
                {listing.sellerPhoneNumber && <div className="listing-seller-phone">{listing.sellerPhoneNumber}</div>}
              </div>
              {listing.sellerPhoneNumber && (
                <a href={`tel:${listing.sellerPhoneNumber}`} className="listing-call-button">
                  <CallIcon width={15} height={15} />
                  {t('market.call')}
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
