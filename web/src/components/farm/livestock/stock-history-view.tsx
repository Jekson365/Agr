import { useEffect, useState } from 'react';

import '@/components/farm/record-list.css';
import { formatLocalizedIsoDateTime } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import { createStockHistory, deleteStockHistory, getStockHistory } from '@/services/stock-history-service';
import type { StockHistory } from '@/types/stock-history';

type Props = {
  /** The animal (LivestockDetail) whose weight history this is. */
  stockId: number;
};

/**
 * Weight-change history for a single animal: the readings over time, plus an
 * "add new record" button that opens a small form to log another weight.
 */
export function StockHistoryView({ stockId }: Props) {
  const { t, language } = useLanguage();

  const [records, setRecords] = useState<StockHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!stockId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRecords(await getStockHistory(stockId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const weight = parseFloat(weightInput);
  const canSubmit = weight > 0 && !saving;

  function openAdd() {
    setWeightInput('');
    setAddOpen(true);
  }

  async function handleAdd() {
    if (!(weight > 0)) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createStockHistory({ stockId, weight });
      setRecords((prev) => [...prev, created]);
      setAddOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteStockHistory(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  if (loading) {
    return <div className="state-box">…</div>;
  }

  // Records come back ordered oldest→newest; derive current weight and total gain from that.
  const current = records.length ? records[records.length - 1].weight : null;
  const gain = records.length >= 2 ? records[records.length - 1].weight - records[0].weight : null;

  const withTrend = records.map((record, i) => ({
    record,
    decreased: i > 0 && record.weight < records[i - 1].weight,
  }));
  const newestFirst = [...withTrend].reverse();

  return (
    <>
      {current != null && (
        <div className="record-summary">
          <div>
            <div className="record-summary-label">{t('history.current')}</div>
            <div className="record-summary-value">
              {current} {t('farm.unitKg')}
            </div>
          </div>
          {gain != null && (
            <div>
              <div className="record-summary-label">{t('history.gain')}</div>
              <div className="record-summary-value">
                {gain >= 0 ? '+' : ''}
                {gain} {t('farm.unitKg')}
              </div>
            </div>
          )}
        </div>
      )}

      {records.length === 0 ? (
        <p className="empty-state">{t('history.empty')}</p>
      ) : (
        <div className="record-list">
          {newestFirst.map(({ record, decreased }) => (
            <div key={record.id} className={decreased ? 'record-card record-card-down' : 'record-card record-card-up'}>
              <div className="record-card-main">
                <span className="record-card-date">{formatLocalizedIsoDateTime(record.createdAt, language)}</span>
              </div>
              <span className={decreased ? 'record-card-value record-card-value-down' : 'record-card-value record-card-value-up'}>
                {record.weight} {t('farm.unitKg')}
              </span>
              <button type="button" className="record-card-delete" onClick={() => handleDelete(record.id)} aria-label={t('common.delete')}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <div className="error-banner">{t('history.loadError')}</div>}

      <button type="button" className="add-button" onClick={openAdd}>
        + {t('history.addRecord')}
      </button>

      {addOpen && (
        <div className="modal-overlay" onClick={() => setAddOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="form-title">{t('history.addRecord')}</h2>

            <div className="form-fields">
              <div className="field">
                <label>{t('history.weightPlaceholder')}</label>
                <input
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder={t('history.weightPlaceholder')}
                  inputMode="decimal"
                  autoFocus
                />
              </div>

              {error && <div className="error-banner">{t('farm.saveError')}</div>}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setAddOpen(false)}>
                {t('common.cancel')}
              </button>
              <button type="button" className="btn" onClick={handleAdd} disabled={!canSubmit}>
                {t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
