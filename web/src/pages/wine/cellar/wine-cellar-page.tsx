import { useEffect, useState } from 'react';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { useLanguage } from '@/contexts/language-context';
import { deleteWineBatch, getWineBatches } from '@/services/wine-batch-service';
import type { WineBatchSummary } from '@/types/wine';
import { WineBatchCard } from './wine-batch-card';
import { WineBatchFormModal } from './wine-batch-form-modal';
import { WineVintageCompare } from './wine-vintage-compare';
import './wine-cellar.css';

export function WineCellarPage() {
  const { t } = useLanguage();

  const [batches, setBatches] = useState<WineBatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WineBatchSummary | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<WineBatchSummary | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setBatches(await getWineBatches());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function openForm(batch: WineBatchSummary | null) {
    setEditing(batch);
    setFormOpen(true);
  }

  function handleSaved(batch: WineBatchSummary, isNew: boolean) {
    setBatches((prev) => (isNew ? [batch, ...prev] : prev.map((item) => (item.id === batch.id ? batch : item))));
  }

  async function confirmDeleteBatch() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteWineBatch(id);
      setBatches((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('wine.cellarTitle')}</h1>
        <div className="page-header-actions">
          <button type="button" className="add-button" onClick={() => openForm(null)}>
            + {t('wine.addBatch')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('farm.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : batches.length === 0 ? (
        <div className="empty-state">{t('wine.empty')}</div>
      ) : (
        <>
          <WineVintageCompare batches={batches} />
          <div className="entity-tile-grid">
            {batches.map((batch) => (
              <WineBatchCard
                key={batch.id}
                batch={batch}
                onEdit={() => openForm(batch)}
                onDelete={batch.stage === 'Stocked' ? undefined : () => setConfirmDelete(batch)}
              />
            ))}
          </div>
        </>
      )}

      <WineBatchFormModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.name ?? ''}
        body={t('wine.deleteBody')}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteBatch}
      />
    </div>
  );
}
