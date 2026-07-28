import { Modal } from '@/components/ui/modal';
import { PACKET_ROWS, PLAN_PACKETS, type LandingPacket } from '@/config/landing';
import { useAuth } from '@/contexts/auth-context';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import type { StoragePlan } from '@/types/auth';
import './packets-modal.css';

/** Landing packet ids ↔ the plan the API reports, so the user's own packet can be marked. */
const PLAN_BY_PACKET: Record<string, StoragePlan> = {
  free: 'Free',
  medium: 'Medium',
  premium: 'Premium',
};

type Props = {
  open: boolean;
  /** Why the packets came up — the cap that was hit, in the user's language. */
  message: string;
  onClose: () => void;
};

/**
 * The available packets, shown where a plan cap blocks an action instead of leaving the user with
 * only an error. Reuses the landing page's packet data so the caps and prices are stated once.
 */
export function PacketsModal({ open, message, onClose }: Props) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  /* A cap reads as a plain number, a number with its period, a size, or included/not — whichever
     the row asked for. `null` always means the packet lifts the cap entirely. */
  function capLabel(packet: LandingPacket, row: (typeof PACKET_ROWS)[number]) {
    const value = packet.limits[row.id];
    if (row.kind === 'boolean') {
      return t(value ? 'profile.limitIncluded' : 'profile.limitNotIncluded');
    }
    if (value === null) return t('profile.limitUnlimited');
    if (row.kind === 'storage') return `${value} MB`;
    if (row.kind === 'perDay') return `${value} ${t('landing.packets.perDay')}`;
    return String(value);
  }

  return (
    <Modal open={open} onClose={onClose} className="packets-overlay">
      <h2 className="form-title">{t('plans.title')}</h2>
      <p className="packets-message">{message}</p>

      <div className="packets-grid">
        {PLAN_PACKETS.map((packet) => {
          const isCurrent = user?.plan === PLAN_BY_PACKET[packet.id];
          return (
            <article key={packet.id} className={isCurrent ? 'packet-card is-current' : 'packet-card'}>
              <div className="packet-head">
                <h3 className="packet-name">{t(packet.nameKey)}</h3>
                {isCurrent && <span className="packet-badge">{t('plans.current')}</span>}
              </div>

              <p className="packet-tagline">{t(`landing.packets.${packet.id}.tagline`)}</p>

              <p className="packet-price">
                <span className="packet-amount">{formatPrice(packet.price)}</span>
                {/* A free packet has no billing period to name. */}
                {packet.price > 0 && <span className="packet-period">{t('landing.packets.perMonth')}</span>}
              </p>

              <dl className="packet-rows">
                {PACKET_ROWS.map((row) => {
                  const off = row.kind === 'boolean' && !packet.limits[row.id];
                  return (
                    <div key={row.id} className="packet-row">
                      <dt>{t(row.labelKey)}</dt>
                      <dd className={off ? 'packet-off' : undefined}>{capLabel(packet, row)}</dd>
                    </div>
                  );
                })}
              </dl>
            </article>
          );
        })}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.close')}
        </button>
      </div>
    </Modal>
  );
}
