import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { isPlantedOut, nextStage } from '@/config/nursery-stage';
import { useLanguage } from '@/contexts/language-context';
import { deleteTreeSeedling, getTreeSeedlings, updateTreeSeedling } from '@/services/tree-seedling-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { TreeSeedling } from '@/types/tree-seedling';
import type { TreeStock } from '@/types/tree-stock';
import { NurseryCard } from './nursery-card';
import { NurseryFormModal } from './nursery-form-modal';
import { PlantOutModal } from './plant-out-modal';
import './nursery.css';

/**
 * The nursery: seed sown in a pot, raised under cover, and once it has hardened off, planted out
 * into an orchard. Planting out is the only step that touches anything outside this page — it
 * adds the trees to the orchard it names and writes them into that orchard's history.
 */
export function NurseryPage() {
  const { t } = useLanguage();

  const [seedlings, setSeedlings] = useState<TreeSeedling[]>([]);
  const [orchards, setOrchards] = useState<TreeStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TreeSeedling | null>(null);
  const [plantOut, setPlantOut] = useState<TreeSeedling | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TreeSeedling | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // Removed orchards included: a batch planted into one still names it.
      const [batches, stock] = await Promise.all([getTreeSeedlings(), getTreeStock(true)]);
      setSeedlings(batches);
      setOrchards(stock);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function patch(saved: TreeSeedling) {
    setSeedlings((prev) => prev.map((row) => (row.id === saved.id ? saved : row)));
  }

  async function advance(seedling: TreeSeedling) {
    const stage = nextStage(seedling.stage);
    if (stage == null) return;
    setBusyId(seedling.id);
    setError(null);
    try {
      const updated = { ...seedling, stage };
      await updateTreeSeedling(seedling.id, updated);
      // The server stamps the date the stage was reached, so read the batch back rather than
      // guessing it here.
      const fresh = (await getTreeSeedlings()).find((row) => row.id === seedling.id);
      patch(fresh ?? updated);
    } catch {
      setError(t('farm.saveError'));
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDeleteBatch() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    setConfirmDelete(null);
    try {
      await deleteTreeSeedling(id);
      setSeedlings((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  // Planting out adds trees to an orchard, so the batch's own figures and the orchard's have both
  // moved — reload rather than patching one and leaving the other stale.
  async function handlePlanted(seedling: TreeSeedling) {
    patch(seedling);
    getTreeStock(true).then(setOrchards).catch(() => {});
  }

  const growing = seedlings.filter((row) => !isPlantedOut(row.stage));
  const planted = seedlings.filter((row) => isPlantedOut(row.stage));
  const liveOrchards = orchards.filter((row) => !row.isDeleted);

  return (
    <div>
      <Link to="/farm/fruits" className="back-link">
        ← {t('farm.fruits')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('nursery.title')}</h1>
        <button
          type="button"
          className="add-button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          + {t('nursery.add')}
        </button>
      </div>

      <p className="nursery-intro">{t('nursery.intro')}</p>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="state-box">…</div>
      ) : seedlings.length === 0 ? (
        <p className="empty-state">{t('nursery.empty')}</p>
      ) : (
        <>
          <div className="nursery-grid">
            {growing.map((seedling) => (
              <NurseryCard
                key={seedling.id}
                seedling={seedling}
                orchards={orchards}
                busy={busyId === seedling.id}
                onAdvance={advance}
                onPlantOut={setPlantOut}
                onEdit={(row) => {
                  setEditing(row);
                  setFormOpen(true);
                }}
                onDelete={setConfirmDelete}
              />
            ))}
          </div>

          {planted.length > 0 && (
            <>
              <h2 className="nursery-section-title">{t('nursery.plantedTitle')}</h2>
              <div className="nursery-grid">
                {planted.map((seedling) => (
                  <NurseryCard
                    key={seedling.id}
                    seedling={seedling}
                    orchards={orchards}
                    busy={false}
                    onAdvance={advance}
                    onPlantOut={setPlantOut}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <NurseryFormModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(saved, isNew) => setSeedlings((prev) => (isNew ? [saved, ...prev] : prev.map((r) => (r.id === saved.id ? saved : r))))}
      />

      <PlantOutModal
        open={plantOut != null}
        seedling={plantOut}
        orchards={liveOrchards}
        onClose={() => setPlantOut(null)}
        onPlanted={handlePlanted}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.name.trim() || confirmDelete?.type || ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteBatch}
      />
    </div>
  );
}
