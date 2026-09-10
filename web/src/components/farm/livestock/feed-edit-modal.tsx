import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { feedTargetOf, type FeedCatalog } from '@/config/feed-source';
import { useLanguage } from '@/contexts/language-context';
import { deleteStockFeed, updateStockFeed } from '@/services/stock-feed-service';
import type { StockFeed } from '@/types/stock-feed';

type Props = {
  feed: StockFeed | null;
  catalog: FeedCatalog;
  onClose: () => void;
  onSaved: (feed: StockFeed) => void;
  onDeleted: (id: number) => void;
};

export function FeedEditModal({ feed, catalog, onClose, onSaved, onDeleted }: Props) {
  const { t } = useLanguage();

  const [amountInput, setAmountInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!feed) return;
    setAmountInput(String(feed.amount));
    setError(null);
  }, [feed]);

  const target = feed ? feedTargetOf(feed, catalog, t) : null;
  const amount = parseFloat(amountInput);
  const amountValid = amount > 0;

  async function handleSave() {
    if (!feed || !amountValid || saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated: StockFeed = { ...feed, amount };
      await updateStockFeed(updated.id, updated);
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!feed || saving) return;
    setSaving(true);
    setError(null);
    try {
      await deleteStockFeed(feed.id);
      onDeleted(feed.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={!!feed} onClose={onClose}>
      <h2 className="form-title">
        {t('feed.editTitle')}
        {target ? ` — ${target.label}` : ''}
      </h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('farm.amount')}</label>
          <input
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder={t('farm.amountPlaceholder')}
            inputMode="decimal"
            autoFocus
          />
          {target && <span className="limit-hint">{target.unitLabel}</span>}
        </div>

        {error && <div className="error-banner">{error}</div>}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary feed-delete" onClick={handleDelete} disabled={saving}>
          {t('common.delete')}
        </button>
        <button type="button" className="btn" onClick={handleSave} disabled={saving || !amountValid}>
          {t('common.save')}
        </button>
      </div>
    </Modal>
  );
}
