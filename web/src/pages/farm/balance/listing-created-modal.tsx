import { Link } from 'react-router-dom';

import { Modal } from '@/components/ui/modal';
import { useLanguage } from '@/contexts/language-context';
import type { MarketListing } from '@/types/market-listing';

type Props = {
  /** The listing just created from a Sell, or null once dismissed. */
  listing: MarketListing | null;
  onClose: () => void;
};

/** Confirms that a balance was put on the marketplace, with a way straight to the listing. */
export function ListingCreatedModal({ listing, onClose }: Props) {
  const { t } = useLanguage();

  return (
    <Modal open={listing != null} onClose={onClose}>
      <div className="sell-success">
        <span className="sell-success-icon">✓</span>
        <h2 className="modal-title">{t('market.listedTitle')}</h2>
        <p className="modal-body-text">
          {t('market.listedBody', {
            title: listing?.title ?? '',
            amount: listing?.quantity ?? 0,
            unit: listing?.priceUnit ?? '',
          })}
        </p>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.close')}
        </button>
        {listing && (
          <Link to={`/market/${listing.id}`} className="btn sell-success-link">
            {t('market.viewListing')}
          </Link>
        )}
      </div>
    </Modal>
  );
}
