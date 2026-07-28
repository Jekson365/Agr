import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { SeedFormModal } from '@/components/farm/seed/seed-form-modal';
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
        <div className="list-card-grid two-col">
          {seeds.map((seed) => {
            const cropLabel = stockTypeLabel(seed.type, t);
            const title = seedTitle(seed, t);
            const onHand = t('seed.onHand', { amount: seed.amount, unit: t(SEED_UNIT_LABEL_KEY[seed.unit]) });
            return (
              <div key={seed.id} className="list-card">
                <Link to={`/farm/seeds/${seed.id}`} className="list-card-body">
                  <span className="list-card-icon-wrap">
                    <img src={stockKindImage(seed.type)} alt="" />
                  </span>
                  <span className="list-card-info">
                    <span className="list-card-title">{title}</span>
                    <br />
                    {/* The crop only needs spelling out when a custom name replaced it above. */}
                    <span className="list-card-subtitle">
                      {seed.name.trim() ? `${cropLabel} · ${onHand}` : onHand}
                    </span>
                  </span>
                </Link>
                <CardMenu onEdit={() => openEdit(seed)} onDelete={() => setConfirmDelete({ id: seed.id, name: title })} />
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
