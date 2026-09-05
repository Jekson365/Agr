import { useLanguage } from '@/contexts/language-context';
import './tree-stock-actions.css';

type Props = {
  onPlant: () => void;
  onRemove: () => void;
};

function Sign({ minus }: { minus?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      aria-hidden="true"
    >
      {!minus && <path d="M12 6v12" />}
      <path d="M6 12h12" />
    </svg>
  );
}

export function TreeStockActions({ onPlant, onRemove }: Props) {
  const { t } = useLanguage();

  return (
    <div className="tsh-actions">
      <button type="button" className="tsh-action plant" onClick={onPlant}>
        <span className="tsh-action-badge">
          <Sign />
        </span>
        {t('treeStockHistory.plant')}
      </button>

      <button type="button" className="tsh-action remove" onClick={onRemove}>
        <span className="tsh-action-badge">
          <Sign minus />
        </span>
        {t('treeStockHistory.remove')}
      </button>
    </div>
  );
}
