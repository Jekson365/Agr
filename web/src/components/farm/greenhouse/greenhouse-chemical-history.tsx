import { useEffect, useRef, useState } from 'react';

import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import { GreenhouseHarvestChemicalFormModal } from '@/components/farm/greenhouse/greenhouse-harvest-chemical-form-modal';
import '@/components/harvest/chemical-history.css';
import { formatLocalizedIsoDay } from '@/components/ui/date-utils';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import {
  deleteGreenhouseHarvestChemical,
  getGreenhouseHarvestChemicals,
} from '@/services/greenhouse-harvest-chemical-service';
import type { GreenhouseHarvestChemical } from '@/types/greenhouse-harvest-chemical';

type Props = {
  greenhouseHarvestId: number;
  /** Called whenever the chemical list changes, with the summed cost — so the parent can fold
   * it into the harvest's final expenses. Fired on load and after every add/edit/delete. */
  onTotalChange?: (total: number) => void;
};

/**
 * Self-contained panel listing the chemicals applied to a greenhouse harvest (name, date, cost),
 * with add/edit/delete. The greenhouse counterpart to ChemicalHistory.
 */
export function GreenhouseChemicalHistory({ greenhouseHarvestId, onTotalChange }: Props) {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const [chemicals, setChemicals] = useState<GreenhouseHarvestChemical[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GreenhouseHarvestChemical | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  const onTotalChangeRef = useRef(onTotalChange);
  onTotalChangeRef.current = onTotalChange;

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [greenhouseHarvestId]);

  const total = chemicals.reduce((sum, c) => sum + c.cost, 0);

  useEffect(() => {
    onTotalChangeRef.current?.(total);
  }, [total]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setChemicals(await getGreenhouseHarvestChemicals(greenhouseHarvestId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function handleSaved(chemical: GreenhouseHarvestChemical, isNew: boolean) {
    setChemicals((prev) => (isNew ? [...prev, chemical] : prev.map((c) => (c.id === chemical.id ? chemical : c))));
  }

  async function confirmDeleteChemical() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteGreenhouseHarvestChemical(id);
      setChemicals((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <div className="chemical-history">
      <div className="chemical-history-header">
        <span className="chemical-history-title">{t('harvestChemical.title')}</span>
        {total > 0 && (
          <span className="chemical-history-total">
            {t('harvestChemical.total')}: {formatPrice(total)}
          </span>
        )}
      </div>

      <div className="chemical-history-body">
        {loading ? (
          <p className="limit-hint">…</p>
        ) : error ? (
          <div className="state-box">
            <span>{t('harvestChemical.loadError')}</span>
            <button type="button" className="retry-button" onClick={load}>
              {t('common.retry')}
            </button>
          </div>
        ) : chemicals.length === 0 ? (
          <p className="empty-state">{t('harvestChemical.empty')}</p>
        ) : (
          <div className="chemical-list">
            {chemicals.map((chemical) => (
              <div key={chemical.id} className="chemical-row">
                <div className="chemical-row-info">
                  <span className="chemical-row-name">{chemical.name}</span>
                  <span className="chemical-row-meta">
                    {formatLocalizedIsoDay(chemical.date, language)} · {formatPrice(chemical.cost)}
                  </span>
                </div>
                <CardMenu
                  onEdit={() => {
                    setEditing(chemical);
                    setFormOpen(true);
                  }}
                  onDelete={() => setConfirmDelete({ id: chemical.id, name: chemical.name })}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <button type="button" className="add-button" onClick={openAdd}>
        + {t('harvestChemical.add')}
      </button>

      <GreenhouseHarvestChemicalFormModal
        open={formOpen}
        greenhouseHarvestId={greenhouseHarvestId}
        editingChemical={editing}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.name ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteChemical}
      />
    </div>
  );
}
