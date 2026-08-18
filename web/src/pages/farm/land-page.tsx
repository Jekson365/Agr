import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import landPlaceholder from '@/assets/properties/land.png';
import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { LandFormModal } from '@/components/farm/land/land-form-modal';
import { PacketsModal } from '@/components/farm/packets-modal';
import { ChevronRightIcon, LeafIcon, LocationIcon, SquareIcon } from '@/components/icons/misc-icons';
import { cropImage, cropLabel } from '@/config/crop';
import { livestockImage, livestockTypeLabel } from '@/config/livestock-kinds';
import { isAtLimit, isOverLimit, isPlanLimitError } from '@/config/plan-benefits';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { deleteFarm, getFarms, restoreFarm } from '@/services/farm-service';
import { getAllLandPlots } from '@/services/land-plot-service';
import { getLivestock } from '@/services/livestock-service';
import type { Farm } from '@/types/farm';
import type { LandPlot } from '@/types/land-plot';
import type { Livestock } from '@/types/livestock';

/** One kind of thing a piece of land holds, as the card shows it: the kind's artwork over how much
 *  of it there is. The name is carried as the tooltip only — the picture is the label. */
type LandContent = { key: string; icon: string; label: string; count: number };

/** How many kinds a card shows before the rest are gathered into a "+N". Enough to say what a
 *  piece of land is for; past that the card would be a list rather than a card. */
const MAX_TILE_CONTENTS = 6;

export function LandPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [farms, setFarms] = useState<Farm[]>([]);
  /** What the cards say each piece of land holds: the plots planted on it and the herds kept
   *  there. */
  const [plots, setPlots] = useState<LandPlot[]>([]);
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Farm | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  /** Non-null while the packet list is up; holds the cap message that raised it. */
  const [packetsMessage, setPacketsMessage] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // Only the land itself decides whether this page loaded. The rest fills in what each card
      // holds — worth showing the land without when any of it can't be read.
      const [farmList, plotList, livestockList] = await Promise.all([
        getFarms(),
        getAllLandPlots().catch(() => [] as LandPlot[]),
        getLivestock().catch(() => [] as Livestock[]),
      ]);
      setFarms(farmList);
      setPlots(plotList);
      setLivestock(livestockList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  /* Removed land is out of use, so it doesn't count against the plan — which is also what the
     server counts, and what makes restoring a piece worth refusing when there is no room. */
  const activeCount = farms.filter((farm) => !farm.isRemoved).length;
  const atLimit = isAtLimit(user?.maxLand, activeCount);
  // Only a downgrade can leave the count past the cap; that is also where the server stops edits.
  const overLimit = isOverLimit(user?.maxLand, activeCount);

  function openAdd() {
    if (atLimit) {
      setPacketsMessage(t('plans.limitReached', { resource: t('farm.land') }));
      return;
    }
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEdit(item: Farm) {
    if (overLimit) {
      setPacketsMessage(t('plans.overLimit', { resource: t('farm.land') }));
      return;
    }
    setEditingItem(item);
    setFormOpen(true);
  }

  /* The client checks above run on a possibly stale user/plan, so the server has the last word —
     when it answers 402 the packets go up just the same. */
  function handleLimitReached(message: string) {
    setFormOpen(false);
    setPacketsMessage(message);
  }

  /* Removing land marks it rather than dropping it, so the card stays put and turns disabled —
     everything recorded on this land still points at it, and a card that vanished would take the
     explanation for all of it with it. */
  async function confirmDeleteItem() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteFarm(id);
      setFarms((prev) => prev.map((f) => (f.id === id ? { ...f, isRemoved: true } : f)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  async function handleRestore(farm: Farm) {
    try {
      await restoreFarm(farm.id);
      setFarms((prev) => prev.map((f) => (f.id === farm.id ? { ...f, isRemoved: false } : f)));
    } catch (err) {
      // The server refuses when the plan has no room for it any more, which is the packets case
      // rather than an error to print over the page.
      if (isPlanLimitError(err)) {
        setPacketsMessage(t('plans.limitReached', { resource: t('farm.land') }));
        return;
      }
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  /**
   * What the land holds, gathered by kind: every plot of apples on it counts as apples once, and
   * two herds of cows are one cow with their heads added up. Crops come first — a piece of land is
   * named for what grows on it, and the animals are what else is kept there.
   */
  function landContents(farmId: number): LandContent[] {
    const byKind = new Map<string, LandContent>();

    function add(key: string, icon: string, label: string, count: number) {
      const existing = byKind.get(key);
      if (existing) {
        existing.count += count;
      } else {
        byKind.set(key, { key, icon, label, count });
      }
    }

    // A plot counts as one of its crop: what a plot records is its share of the land, not an
    // amount, so the number here is how many plots of that crop the land carries.
    for (const plot of plots) {
      if (plot.farmId !== farmId) continue;
      add(`crop-${plot.crop}`, cropImage(plot.crop), cropLabel(plot.crop, t), 1);
    }

    // A herd counts as its head count, which is an amount of animals in its own right.
    for (const group of livestock) {
      if (group.farmId !== farmId) continue;
      add(`herd-${group.type}`, livestockImage(group.type), livestockTypeLabel(group.type, t), group.count);
    }

    return [...byKind.values()];
  }

  function handleSaved(farm: Farm, isNew: boolean) {
    setFarms((prev) => (isNew ? [...prev, farm] : prev.map((f) => (f.id === farm.id ? farm : f))));
  }

  return (
    <div>
      <Link to="/farm" className="back-link">
        ← {t('farm.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('farm.land')}</h1>
        {/* Enabled even at the cap — clicking it answers with the available packets. */}
        <button type="button" className="add-button" onClick={openAdd}>
          + {t('farm.addFarmland')}
        </button>
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
      ) : (
        <div className="land-tile-grid">
          {farms.map((item) => {
            const contents = landContents(item.id);
            const shown = contents.slice(0, MAX_TILE_CONTENTS);
            const hidden = contents.length - shown.length;

            return (
            /* Removed land keeps its card and turns disabled — see Farm.isRemoved. It is still
               readable, and still opens, so the plots and herds recorded on it can be reached. */
            <div key={item.id} className={item.isRemoved ? 'land-tile is-removed' : 'land-tile'}>
              {/* Photo first: it is what tells one piece of land from another at a glance, and
                  the name underneath reads as its caption. */}
              <Link to={`/farm/land/${item.id}`} className="land-tile-media">
                <img
                  src={item.imagePath ? resolveAssetUrl(item.imagePath) : landPlaceholder}
                  alt=""
                  className="land-tile-image"
                />
                <span className="land-tile-badge">
                  <LeafIcon width={26} height={26} />
                </span>
              </Link>

              {/* Sits over the photo rather than in the text, so the body below stays a clean
                  column. Removed land takes no edits, so its menu offers putting it back instead. */}
              <div className="land-tile-menu">
                {item.isRemoved ? (
                  <CardMenu extra={{ labelKey: 'farm.restoreLand', onSelect: () => handleRestore(item) }} />
                ) : (
                  <CardMenu
                    onEdit={() => openEdit(item)}
                    onDelete={() => setConfirmDelete({ id: item.id, name: item.name })}
                  />
                )}
              </div>

              <div className="land-tile-body">
                <h2 className="land-tile-title">
                  {item.name}
                  {item.isRemoved && <span className="removed-chip">{t('balance.removed')}</span>}
                </h2>

                <div className="land-tile-meta">
                  <div className="land-tile-row">
                    <SquareIcon width={16} height={16} />
                    <span>
                      {t('farm.area')} {item.area} {t('farm.areaUnit')}
                    </span>
                  </div>
                  <div className="land-tile-row">
                    <LocationIcon width={16} height={16} />
                    <span>{item.location}</span>
                  </div>
                </div>

                {/* What the land is actually for, in its own artwork: the crops planted on it and
                    the herds kept there. The kind's name is the tooltip — on the card the picture
                    says it, with how many under it. Land holding neither skips the row. */}
                {contents.length > 0 && (
                  <div className="land-tile-contents">
                    {shown.map((entry) => (
                      <span key={entry.key} className="land-tile-chip" title={`${entry.label}: ${entry.count}`}>
                        <img src={entry.icon} alt={entry.label} />
                        <b>{entry.count}</b>
                      </span>
                    ))}
                    {hidden > 0 && <span className="land-tile-chip more">+{hidden}</span>}
                  </div>
                )}

                <span className="land-tile-divider" />

                {/* Opening a land shows its plots, mirroring the mobile app. */}
                <Link to={`/farm/land/${item.id}`} className="land-tile-details">
                  {t('common.details')}
                  <ChevronRightIcon width={16} height={16} />
                </Link>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {atLimit && <p className="limit-hint">{t('plans.limitReached', { resource: t('farm.land') })}</p>}

      <LandFormModal
        open={formOpen}
        editingItem={editingItem}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        onLimitReached={handleLimitReached}
      />

      <PacketsModal
        open={packetsMessage != null}
        message={packetsMessage ?? ''}
        onClose={() => setPacketsMessage(null)}
      />

      {/* Removing land disables it rather than dropping it — say so, since the standard "cannot be
          undone" line overstates what happens to the plots, herds and harvests on it. */}
      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.name ?? ''}
        body={t('farm.removeLandBody')}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteItem}
      />
    </div>
  );
}
