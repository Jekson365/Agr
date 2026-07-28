import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import harvestIcon from '@/assets/icons/harvest.png';
import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { GreenhouseHarvestFormModal } from '@/components/farm/greenhouse/greenhouse-harvest-form-modal';
import '@/components/harvest/harvest.css';
import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { daysUntilExpected, isOverdue } from '@/config/harvest-analysis';
import { HARVEST_STATUS_BADGE_CLASS, HARVEST_STATUS_LABEL_KEY } from '@/config/harvest-status';
import { useLanguage } from '@/contexts/language-context';
import { deleteGreenhouseHarvest, getGreenhouseHarvests } from '@/services/greenhouse-harvest-service';
import { getGreenhouses } from '@/services/greenhouse-service';
import type { Greenhouse } from '@/types/greenhouse';
import type { GreenhouseHarvest } from '@/types/greenhouse-harvest';

export function GreenhouseHarvestPage() {
  const { t, language } = useLanguage();

  const [harvests, setHarvests] = useState<GreenhouseHarvest[]>([]);
  const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState<GreenhouseHarvest | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; title: string } | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [harvestList, greenhouseList] = await Promise.all([getGreenhouseHarvests(), getGreenhouses()]);
      setHarvests(harvestList);
      setGreenhouses(greenhouseList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function greenhouseName(id: number): string {
    return greenhouses.find((house) => house.id === id)?.name ?? '';
  }

  function openAdd() {
    setEditingHarvest(null);
    setFormOpen(true);
  }

  function openEdit(item: GreenhouseHarvest) {
    setEditingHarvest(item);
    setFormOpen(true);
  }

  async function confirmDeleteItem() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteGreenhouseHarvest(id);
      setHarvests((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  function handleSaved(harvest: GreenhouseHarvest, isNew: boolean) {
    setHarvests((prev) =>
      isNew
        ? [harvest, ...prev]
        : prev.map((h) => (h.id === harvest.id ? harvest : h))
    );
  }

  return (
    <div>
      <Link to="/farm/greenhouse" className="back-link">
        ← {t('farm.greenhouse')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('greenhouse.harvestTitle')}</h1>
        <button type="button" className="add-button" onClick={openAdd} disabled={greenhouses.length === 0}>
          + {t('greenhouse.addHarvest')}
        </button>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('harvest.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : greenhouses.length === 0 ? (
        <p className="empty-state">{t('greenhouse.addFirst')}</p>
      ) : harvests.length === 0 ? (
        <p className="empty-state">{t('greenhouse.harvestEmpty')}</p>
      ) : (
        <div className="list-card-grid">
          {harvests.map((item) => {
            const overdue = isOverdue(item);
            const daysLeft = daysUntilExpected(item);

            return (
              <div key={item.id} className="list-card">
                <Link to={`/farm/greenhouse/harvest/${item.id}`} className="list-card-body">
                  <span className="list-card-icon-wrap">
                    <img src={harvestIcon} alt="" />
                  </span>
                  <span className="list-card-info">
                    <span className="list-card-title">{item.title}</span>
                    <br />
                    <span className="list-card-subtitle">
                      {formatLocalizedIsoDate(item.date, language)} · {greenhouseName(item.greenhouseId)}
                    </span>
                    <br />
                    <span className={`${HARVEST_STATUS_BADGE_CLASS[item.status]} harvest-status-badge`}>
                      {t(HARVEST_STATUS_LABEL_KEY[item.status])}
                    </span>
                    {overdue ? (
                      <span className="harvest-overdue-badge">{t('harvest.overdueBy', { days: Math.abs(daysLeft ?? 0) })}</span>
                    ) : item.status !== 'Harvested' && daysLeft != null ? (
                      <span className="harvest-due-badge">{t('harvest.dueIn', { days: daysLeft })}</span>
                    ) : null}
                  </span>
                </Link>
                <CardMenu
                  onEdit={() => openEdit(item)}
                  onDelete={() => setConfirmDelete({ id: item.id, title: item.title })}
                />
              </div>
            );
          })}
        </div>
      )}

      <GreenhouseHarvestFormModal
        open={formOpen}
        editingHarvest={editingHarvest}
        greenhouses={greenhouses}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.title ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteItem}
      />
    </div>
  );
}
