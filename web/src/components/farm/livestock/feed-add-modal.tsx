import { useEffect, useState } from 'react';

import '@/components/farm/kind-picker.css';
import { Modal } from '@/components/ui/modal';
import {
  FEED_SOURCE_ICON,
  FEED_SOURCE_LABEL_KEY,
  FEED_SOURCES,
  feedTargetFields,
  feedTargets,
  isFeedCatalogEmpty,
  type FeedCatalog,
  type FeedSource,
  type FeedTarget,
} from '@/config/feed-source';
import { useLanguage } from '@/contexts/language-context';
import { createStockFeed } from '@/services/stock-feed-service';
import type { StockFeed } from '@/types/stock-feed';

type Props = {
  open: boolean;
  livestockId: number;
  catalog: FeedCatalog;
  onClose: () => void;
  onAdded: (feed: StockFeed) => void;
};

export function FeedAddModal({ open, livestockId, catalog, onClose, onAdded }: Props) {
  const { t } = useLanguage();

  const [source, setSource] = useState<FeedSource>('Stock');
  const [targetId, setTargetId] = useState<number | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targets = feedTargets(catalog, source, t);
  const selected = targets.find((target) => target.id === targetId) ?? null;
  const amount = parseFloat(amountInput);
  const amountValid = amount > 0;

  useEffect(() => {
    if (!open) return;
    const first = FEED_SOURCES.find((name) => feedTargets(catalog, name, t).length > 0) ?? 'Stock';
    setSource(first);
    setTargetId(feedTargets(catalog, first, t)[0]?.id ?? null);
    setAmountInput('');
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function pickSource(name: FeedSource) {
    setSource(name);
    setTargetId(feedTargets(catalog, name, t)[0]?.id ?? null);
  }

  async function handleAdd() {
    if (!selected || !amountValid || saving) return;
    setSaving(true);
    setError(null);
    try {
      onAdded(await createStockFeed({ livestockId, ...feedTargetFields(selected), amount }));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{t('feed.addTitle')}</h2>

      {isFeedCatalogEmpty(catalog) ? (
        <p className="limit-hint">{t('feed.noStock')}</p>
      ) : (
        <div className="form-fields">
          <div className="field">
            <label>{t('feed.source')}</label>
            <div className="kind-row">
              {FEED_SOURCES.map((name) => (
                <button
                  key={name}
                  type="button"
                  className={source === name ? 'kind-chip active' : 'kind-chip'}
                  onClick={() => pickSource(name)}
                >
                  <img src={FEED_SOURCE_ICON[name]} className="kind-chip-icon" alt="" />
                  <span>{t(FEED_SOURCE_LABEL_KEY[name])}</span>
                </button>
              ))}
            </div>
          </div>

          <FeedTargetField targets={targets} selectedId={targetId} onSelect={setTargetId} />

          <div className="field">
            <label>{t('farm.amount')}</label>
            <input
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder={t('farm.amountPlaceholder')}
              inputMode="decimal"
            />
            {selected && <span className="limit-hint">{selected.unitLabel}</span>}
          </div>

          {error && <div className="error-banner">{error}</div>}
        </div>
      )}

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        {!isFeedCatalogEmpty(catalog) && (
          <button type="button" className="btn" onClick={handleAdd} disabled={saving || !amountValid || !selected}>
            {t('common.add')}
          </button>
        )}
      </div>
    </Modal>
  );
}

function FeedTargetField({
  targets,
  selectedId,
  onSelect,
}: {
  targets: FeedTarget[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="field">
      <label>{t('feed.selectStock')}</label>
      {targets.length === 0 ? (
        <span className="limit-hint">{t('feed.noneOfSource')}</span>
      ) : (
        <div className="kind-row">
          {targets.map((target) => (
            <button
              key={target.id}
              type="button"
              className={selectedId === target.id ? 'kind-chip active' : 'kind-chip'}
              onClick={() => onSelect(target.id)}
            >
              <img src={target.icon} className="kind-chip-icon" alt="" />
              <span>{target.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
