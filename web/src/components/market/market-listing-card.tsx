import { Link } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { EquipmentIcon, ImagesIcon, TagIcon } from '@/components/icons/misc-icons';
import { listingImage, listingItemLabel } from '@/config/market-listing';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import type { MarketListing } from '@/types/market-listing';

type Props = {
  item: MarketListing;
  onEdit: () => void;
  onDelete: (name: string) => void;
  onToggleSold: () => void;
  /** Absent once the listing is promoted or already waiting on a decision. */
  onRequestPremium?: () => void;
};

/** One listing in the seller's own grid: its cover, what it is, and what can be done with it. */
export function MarketListingCard({ item, onEdit, onDelete, onToggleSold, onRequestPremium }: Props) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  const typeLabel = listingItemLabel(item.category, item.itemType, t);
  const title = item.title.trim() || typeLabel;
  const fallbackImage = listingImage(item.category, item.itemType);
  const coverImage = item.imagePaths[0];
  const isCompleted = item.status === 'Completed';

  return (
    <div className="product-card">
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

          {item.isPremium && <span className="listing-premium">★ {t('market.premium')}</span>}
          {!item.isPremium && item.premiumRequestedAt && (
            <span className="listing-premium pending">{t('market.premiumPending')}</span>
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
        onClick={onToggleSold}
        aria-label={isCompleted ? t('market.markActive') : t('market.markCompleted')}
      >
        {isCompleted ? t('market.sold') : t('market.markSold')}
      </button>

      <div className="listing-menu">
        <CardMenu
          onEdit={onEdit}
          onDelete={() => onDelete(title)}
          extra={onRequestPremium ? { labelKey: 'market.requestPremium', onSelect: onRequestPremium } : undefined}
        />
      </div>
    </div>
  );
}
