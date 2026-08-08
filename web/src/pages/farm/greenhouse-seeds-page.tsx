import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { GreenhouseSeedFormModal } from '@/components/farm/greenhouse/greenhouse-seed-form-modal';
import { BoxIcon, LeafIcon, LocationIcon } from '@/components/icons/misc-icons';
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
        <div className="entity-tile-grid">
          {seeds.map((item) => {
            const typeLabel = stockTypeLabel(item.type, t);
            const title = item.name.trim() || typeLabel;
            const onHand = t('seed.onHand', {
              amount: item.amount,
              unit: t(SEED_UNIT_LABEL_KEY[item.unit] ?? item.unit),
            });
            return (
              <div key={item.id} className="entity-tile">
                {/* Greenhouse seed has no page of its own, so the panel is a plain frame rather
                    than a link and the card ends at its facts — no details button to offer. */}
                <div className="entity-tile-media">
                  <img src={stockKindImage(item.type)} alt="" className="entity-tile-icon" />
                </div>

                <div className="entity-tile-menu">
                  <CardMenu
                    onEdit={() => setEditingSeed(item)}
                    onDelete={() => setConfirmDelete({ id: item.id, name: title })}
                  />
                </div>

                <div className="entity-tile-body">
                  <h2 className="entity-tile-title">{title}</h2>

                  <div className="entity-tile-meta">
                    <div className="entity-tile-row">
                      <BoxIcon width={16} height={16} />
                      <span>{onHand}</span>
                    </div>
                    {/* The crop only needs spelling out when a custom name replaced it above. */}
                    {item.name.trim() && (
                      <div className="entity-tile-row">
                        <LeafIcon width={16} height={16} />
                        <span>{typeLabel}</span>
                      </div>
                    )}
                    <div className="entity-tile-row">
                      <LocationIcon width={16} height={16} />
                      <span>{greenhouseName(item.greenhouseId)}</span>
                    </div>
                  </div>
                </div>
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
