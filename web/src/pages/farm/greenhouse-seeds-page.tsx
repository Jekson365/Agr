import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { GreenhouseSeedFormModal } from '@/components/farm/greenhouse/greenhouse-seed-form-modal';
import { SEED_UNIT_LABEL_KEY } from '@/config/seed-kinds';
import { stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { deleteGreenhouseSeed, getGreenhouseSeeds } from '@/services/greenhouse-stock-service';
import { getGreenhouses } from '@/services/greenhouse-service';
import type { Greenhouse } from '@/types/greenhouse';
import type { GreenhouseSeed } from '@/types/greenhouse-stock';

/**
 * Seed held for sowing under glass. Rows are created with their stock, so this page lists and
 * removes them rather than offering an add of its own.
 */
export function GreenhouseSeedsPage() {
  const { t } = useLanguage();

  const [seeds, setSeeds] = useState<GreenhouseSeed[]>([]);
  const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  const [editingSeed, setEditingSeed] = useState<GreenhouseSeed | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [seedList, greenhouseList] = await Promise.all([getGreenhouseSeeds(), getGreenhouses()]);
      setSeeds(seedList);
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

  async function confirmDeleteItem() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteGreenhouseSeed(id);
      setSeeds((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <div>
      <Link to="/farm/greenhouse" className="back-link">
        ← {t('farm.greenhouse')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('greenhouse.seedTitle')}</h1>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('seed.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : seeds.length === 0 ? (
        <p className="empty-state">{t('greenhouse.seedEmpty')}</p>
      ) : (
        <div className="list-card-grid">
          {seeds.map((item) => {
            const typeLabel = stockTypeLabel(item.type, t);
            const title = item.name.trim() || typeLabel;
            return (
              <div key={item.id} className="list-card">
                <div className="list-card-body">
                  <span className="list-card-icon-wrap">
                    <img src={stockKindImage(item.type)} alt="" />
                  </span>
                  <span className="list-card-info">
                    <span className="list-card-title">{title}</span>
                    <br />
                    <span className="list-card-subtitle">
                      {t('seed.onHand', { amount: item.amount, unit: t(SEED_UNIT_LABEL_KEY[item.unit] ?? item.unit) })}
                    </span>
                    <br />
                    <span className="list-card-subtitle">{greenhouseName(item.greenhouseId)}</span>
                  </span>
                </div>
                <CardMenu
                  onEdit={() => setEditingSeed(item)}
                  onDelete={() => setConfirmDelete({ id: item.id, name: title })}
                />
              </div>
            );
          })}
        </div>
      )}

      <GreenhouseSeedFormModal
        open={editingSeed != null}
        editingSeed={editingSeed}
        onClose={() => setEditingSeed(null)}
        onSaved={(seed) => setSeeds((prev) => prev.map((s) => (s.id === seed.id ? seed : s)))}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.name ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteItem}
      />
    </div>
  );
}
