import { Link } from 'react-router-dom';

import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import type { PremiumRequest } from '@/types/admin';

type Props = {
  requests: PremiumRequest[];
  /** The listing being decided, so only its own buttons go quiet. */
  busyId: number | null;
  onDecide: (listingId: number, approve: boolean) => void;
};

/** Listings waiting to be promoted, and the operator's yes or no on each. */
export function ManagerPremiumList({ requests, busyId, onDecide }: Props) {
  const { t, language } = useLanguage();

  return (
    <div className="manager-request-list">
      {requests.map((r) => {
        const title = r.title.trim() || r.itemType || '—';
        const cover = r.imagePaths[0];
        return (
          <div key={r.listingId} className="manager-request">
            <div className="manager-request-image">
              {cover ? <img src={resolveAssetUrl(cover)} alt="" /> : <span>{title.charAt(0).toUpperCase()}</span>}
            </div>

            <div className="manager-request-body">
              <div className="manager-request-title">{title}</div>
              <div className="manager-user-sub">
                {r.sellerName || '—'} · {r.sellerEmail || '—'}
              </div>
              <div className="manager-user-sub">
                {r.price} {r.priceUnit && `/ ${r.priceUnit}`}
                {r.location && ` · ${r.location}`}
              </div>
              <div className="manager-user-sub">
                {t('manager.requestedOn')} {formatLocalizedIsoDate(r.requestedAt, language)}
              </div>
            </div>

            <div className="manager-request-actions">
              <Link to={`/market/${r.listingId}`} className="btn btn-secondary manager-view">
                {t('manager.view')}
              </Link>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={busyId === r.listingId}
                onClick={() => onDecide(r.listingId, false)}
              >
                {t('manager.reject')}
              </button>
              <button
                type="button"
                className="btn manager-approve"
                disabled={busyId === r.listingId}
                onClick={() => onDecide(r.listingId, true)}
              >
                {busyId === r.listingId ? '…' : t('manager.approve')}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
