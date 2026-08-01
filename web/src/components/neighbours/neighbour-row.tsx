import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import type { Neighbour } from '@/types/neighbour';

type Action = {
  label: string;
  onClick: () => void;
  /** Draws the button as the row's main action rather than a quiet secondary one. */
  primary?: boolean;
  danger?: boolean;
};

type Props = {
  neighbour: Neighbour;
  actions: Action[];
  /** True while one of this row's actions is in flight, which disables them all. */
  busy?: boolean;
};

/** One person in the panel: who they are, how far off they farm, and what can be done about them. */
export function NeighbourRow({ neighbour, actions, busy }: Props) {
  const { t } = useLanguage();

  const fullName = [neighbour.name, neighbour.surname].filter(Boolean).join(' ').trim() || neighbour.email;
  const place = [neighbour.city, neighbour.country].filter(Boolean).join(', ');
  const distance =
    neighbour.distanceKm != null ? t('neighbours.away', { distance: formatDistance(neighbour.distanceKm) }) : null;

  return (
    <div className="neighbour-row">
      <div className="neighbour-avatar">
        {neighbour.imagePath ? (
          <img src={resolveAssetUrl(neighbour.imagePath)} alt="" />
        ) : (
          <span>{initials(neighbour)}</span>
        )}
      </div>

      <div className="neighbour-identity">
        <span className="neighbour-name">{fullName}</span>
        {/* Whichever of the two is known — where they farm says more than an email, but an email
            is what a search result usually has to go on. */}
        <span className="neighbour-detail">{place || neighbour.email}</span>
        {distance && <span className="neighbour-distance">{distance}</span>}
        {neighbour.phoneNumber && (
          <a className="neighbour-phone" href={`tel:${neighbour.phoneNumber}`}>
            {neighbour.phoneNumber}
          </a>
        )}
      </div>

      <div className="neighbour-actions">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className={actionClass(action)}
            onClick={action.onClick}
            disabled={busy}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function actionClass({ primary, danger }: Action): string {
  if (primary) return 'neighbour-action primary';
  if (danger) return 'neighbour-action danger';
  return 'neighbour-action';
}

/** Initials for someone with no profile photo, falling back to the first letter of their email. */
function initials(neighbour: Neighbour): string {
  const letters = [neighbour.name, neighbour.surname]
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .join('');
  return (letters || neighbour.email.charAt(0)).toUpperCase();
}

/** Under a kilometre reads better in metres — "0.4 km away" undersells how close that is. */
function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km} km`;
}
