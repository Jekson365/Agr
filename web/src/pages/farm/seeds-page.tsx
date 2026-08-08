import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { SeedFormModal } from '@/components/farm/seed/seed-form-modal';
import { BoxIcon, ChevronRightIcon, LeafIcon } from '@/components/icons/misc-icons';
import { SEED_UNIT_LABEL_KEY, seedTitle } from '@/config/seed-kinds';
import { stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { deleteSeed, getSeeds } from '@/services/seed-service';
import type { Seed } from '@/types/seed';

export function SeedsPage() {
  const { t } = useLanguage();

  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingSeed, setEditingSeed] = useState<Seed | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setSeeds(await getSeeds());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  // Disabled along with the add button above — seeds aren't created from this page.
  // function openAdd() {
  //   setEditingSeed(null);
  //   setFormOpen(true);
  // }

  function openEdit(seed: Seed) {
    setEditingSeed(seed);
    setFormOpen(true);
  }

  async function confirmDeleteSeed() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteSeed(id);
      setSeeds((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      // The server refuses while a harvest still records this seed as sown.
      setError(
        err instanceof ApiError && err.status === 409
          ? t('seed.deleteInUse')
          : err instanceof Error
            ? err.message
            : String(err)
      );
    } finally {
      setConfirmDelete(null);
    }
  }

  function handleSaved(seed: Seed, isNew: boolean) {
    setSeeds((prev) => (isNew ? [...prev, seed] : prev.map((s) => (s.id === seed.id ? seed : s))));
  }


  return (
    <div>
      <Link to="/farm" className="back-link">
        ← {t('farm.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('seed.title')}</h1>
        {/* Adding seed here is disabled — seeds are created elsewhere, not from this page.
        <button type="button" className="add-button" onClick={openAdd}>
          + {t('seed.add')}
        </button>
        */}
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
        <p className="empty-state">{t('seed.empty')}</p>
      ) : (
        <div className="entity-tile-grid">
          {seeds.map((seed) => {
            const cropLabel = stockTypeLabel(seed.type, t);
            const title = seedTitle(seed, t);
            const onHand = t('seed.onHand', { amount: seed.amount, unit: t(SEED_UNIT_LABEL_KEY[seed.unit]) });
            return (
              <div key={seed.id} className="entity-tile">
                <Link to={`/farm/seeds/${seed.id}`} className="entity-tile-media">
                  <img src={stockKindImage(seed.type)} alt="" className="entity-tile-icon" />
                </Link>

                <div className="entity-tile-menu">
                  <CardMenu onEdit={() => openEdit(seed)} onDelete={() => setConfirmDelete({ id: seed.id, name: title })} />
                </div>

                <div className="entity-tile-body">
                  <h2 className="entity-tile-title">{title}</h2>

                  <div className="entity-tile-meta">
                    <div className="entity-tile-row">
                      <BoxIcon width={16} height={16} />
                      <span>{onHand}</span>
                    </div>
                    {/* The crop only needs spelling out when a custom name replaced it above. */}
                    {seed.name.trim() && (
                      <div className="entity-tile-row">
                        <LeafIcon width={16} height={16} />
                        <span>{cropLabel}</span>
                      </div>
                    )}
                  </div>

                  <span className="entity-tile-divider" />

                  <Link to={`/farm/seeds/${seed.id}`} className="entity-tile-details">
                    {t('common.details')}
                    <ChevronRightIcon width={16} height={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SeedFormModal open={formOpen} editingSeed={editingSeed} onClose={() => setFormOpen(false)} onSaved={handleSaved} />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.name ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteSeed}
      />
    </div>
  );
}
