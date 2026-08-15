import { useEffect, useMemo, useRef, useState } from 'react';

import { TerritoryMap } from '@/components/farm/land/territory-map';
import { cropImage, cropLabel } from '@/config/crop';
import {
  formatArea,
  territoryAreaHectares,
  toOtherTerritories,
  toOwnTerritories,
  type OtherTerritory,
} from '@/config/territory';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { getFarms } from '@/services/farm-service';
import { getLandPlots } from '@/services/land-plot-service';
import {
  getNeighbourTerritories,
  getTerritoryDetails,
  removeNeighbour,
  sendNeighbourRequest,
} from '@/services/neighbour-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { Farm } from '@/types/farm';
import type { NeighbourTerritory, TerritoryCrop } from '@/types/neighbour';
import type { TreeStock } from '@/types/tree-stock';

import './map-page.css';

/** One field in the panel's list. Comes from the outlines the map already has, so switching
 *  between a farmer's fields costs nothing. */
type Holding = {
  key: string;
  farmName: string;
  hectaresMarked: number;
};

/** Everything the panel shows about the field that was picked — fetched when it is picked. */
type Details = {
  /** Null for the signed-in user: their own land has no one to be introduced to. */
  userId: number | null;
  name: string;
  imagePath: string;
  place: string;
  distanceKm: number | null;
  isNeighbour: boolean;
  farmName: string;
  crops: TerritoryCrop[];
};

/** Which land an outline's key stands for. `own-12` is the user's; `4-12` is user 4's field 12. */
function parseKey(key: string): { ownerId: number | null; farmId: number } | null {
  const [head, tail] = key.split('-');
  const farmId = Number(tail);
  if (!Number.isFinite(farmId)) return null;
  if (head === 'own') return { ownerId: null, farmId };
  const ownerId = Number(head);
  return Number.isFinite(ownerId) ? { ownerId, farmId } : null;
}

export function MapPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [territories, setTerritories] = useState<NeighbourTerritory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [details, setDetails] = useState<Details | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  /** Bumped to re-ask the server about the field in hand after acting on its owner. */
  const [detailsNonce, setDetailsNonce] = useState(0);

  /** The user's own fruit entries, so a plot of theirs can go by the one it grows. Fetched at most
   *  once, and only if they ever look at their own land. */
  const treeStockRef = useRef<TreeStock[] | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [ownFarms, nearby] = await Promise.all([getFarms(), getNeighbourTerritories()]);
      setFarms(ownFarms);
      setTerritories(nearby);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  // Everything on the map at once: the user's own land and everyone else's. Nothing is the
  // "current" land here, so all of it goes in as context and all of it answers a click.
  const outlines = useMemo<OtherTerritory[]>(
    () => [...toOwnTerritories(farms), ...toOtherTerritories(territories)],
    [farms, territories],
  );

  /** The fields belonging to whoever owns a given outline, keyed by every one of their outlines —
   *  so picking any field of theirs lists the rest. */
  const holdingsByKey = useMemo(() => {
    const byOwner = new Map<string, Holding[]>();
    for (const outline of outlines) {
      const parsed = parseKey(outline.key);
      const owner = parsed?.ownerId == null ? 'own' : String(parsed.ownerId);
      const holding: Holding = {
        key: outline.key,
        // The outline's label carries the owner's name for other people's land; the panel is
        // already saying whose it is, so keep just the field's own name.
        farmName: outline.label.split(' · ').at(-1) ?? outline.label,
        hectaresMarked: territoryAreaHectares(outline.points),
      };
      const existing = byOwner.get(owner);
      if (existing) existing.push(holding);
      else byOwner.set(owner, [holding]);
    }

    const map = new Map<string, Holding[]>();
    for (const holdings of byOwner.values()) {
      for (const holding of holdings) {
        map.set(holding.key, holdings);
      }
    }
    return map;
  }, [outlines]);

  const holdings = selectedKey ? (holdingsByKey.get(selectedKey) ?? []) : [];

  // The details are the one thing worth a request, so they are fetched when — and only when — a
  // field is picked out.
  useEffect(() => {
    if (!selectedKey) {
      setDetails(null);
      return;
    }
    const parsed = parseKey(selectedKey);
    if (!parsed) {
      setDetails(null);
      return;
    }

    let cancelled = false;
    setDetailsLoading(true);
    setDetails(null);

    void (async () => {
      try {
        const loaded = parsed.ownerId === null ? await loadOwn(parsed.farmId) : await loadOther(parsed.ownerId, parsed.farmId);
        if (!cancelled) setDetails(loaded);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setDetailsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, detailsNonce]);

  /** The user's own land: read straight from their own endpoints, not the neighbourhood one. */
  async function loadOwn(farmId: number): Promise<Details> {
    const farm = farms.find((item) => item.id === farmId);
    if (treeStockRef.current === null) {
      // Fruits can be switched off for a tenant; without them a plot just goes by its crop. Removed
      // orchards are included so a plot planted with one keeps naming it rather than falling back.
      treeStockRef.current = await getTreeStock(true).catch(() => []);
    }
    const plots = await getLandPlots(farmId);

    return {
      userId: null,
      name: user?.name ?? '',
      imagePath: user?.imagePath ?? '',
      place: [user?.city, user?.country].filter(Boolean).join(', '),
      distanceKm: null,
      isNeighbour: false,
      farmName: farm?.name ?? '',
      crops: plots.map((plot) => ({
        crop: plot.crop,
        name: treeStockRef.current?.find((stock) => stock.id === plot.treeStockId)?.name ?? '',
        area: plot.area,
      })),
    };
  }

  async function loadOther(ownerId: number, farmId: number): Promise<Details> {
    const found = await getTerritoryDetails(ownerId, farmId);
    return {
      userId: found.userId,
      name: [found.name, found.surname].filter(Boolean).join(' ').trim(),
      imagePath: found.imagePath,
      place: [found.city, found.country].filter(Boolean).join(', '),
      distanceKm: found.distanceKm,
      isNeighbour: found.isNeighbour,
      farmName: found.farmName,
      crops: found.crops,
    };
  }

  /** Sends or drops a neighbour link, then reloads so the map recolours with it. */
  async function act(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await load();
      // Ask again rather than assume: sending a request only makes them a neighbour if they had
      // already asked you, so what it left behind is the server's to say.
      setDetailsNonce((nonce) => nonce + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="map-page">
      <div className="map-page-map">
        {loading ? (
          <div className="map-page-state">…</div>
        ) : (
          <TerritoryMap
            points={[]}
            others={outlines}
            onSelectOther={setSelectedKey}
            selectedKey={selectedKey}
            wheelZoom
            fallbackCenter={
              user?.latitude != null && user?.longitude != null
                ? { lat: user.latitude, lng: user.longitude }
                : null
            }
          />
        )}
      </div>

      <aside className="map-page-panel">
        <h1 className="map-page-title">{t('map.title')}</h1>
        {error && <div className="error-banner">{error}</div>}

        {!selectedKey ? (
          <div className="map-page-empty">
            <p>{t('map.pickHint')}</p>
            {!loading && outlines.length === 0 && <p>{t('map.noTerritories')}</p>}
          </div>
        ) : detailsLoading || !details ? (
          <div className="map-page-empty">…</div>
        ) : (
          <div className="map-page-farmer">
            <div className="map-page-avatar">
              {details.imagePath ? (
                <img src={resolveAssetUrl(details.imagePath)} alt="" />
              ) : (
                <span>{(details.name.charAt(0) || '?').toUpperCase()}</span>
              )}
            </div>

            <h2 className="map-page-farmer-name">
              {details.userId === null ? t('map.you') : details.name || t('map.unnamedFarmer')}
            </h2>

            {details.place && <p className="map-page-detail">{details.place}</p>}
            {details.distanceKm != null && (
              <p className="map-page-detail">
                {t('neighbours.away', { distance: `${details.distanceKm} km` })}
              </p>
            )}

            {details.userId !== null && (
              <div className="map-page-actions">
                {details.isNeighbour ? (
                  <>
                    <span className="map-page-badge">{t('map.isNeighbour')}</span>
                    <button
                      type="button"
                      className="map-page-action danger"
                      disabled={busy}
                      onClick={() => act(() => removeNeighbour(details.userId!))}
                    >
                      {t('neighbours.remove')}
                    </button>
                  </>
                ) : (
                  // One button covers asking and answering: sending to someone who already asked
                  // you is taken as accepting them.
                  <button
                    type="button"
                    className="map-page-action primary"
                    disabled={busy}
                    onClick={() => act(() => sendNeighbourRequest(details.userId!))}
                  >
                    {t('neighbours.add')}
                  </button>
                )}
              </div>
            )}

            {holdings.length > 1 && (
              <>
                <h3 className="map-page-section">{t('map.theirLand')}</h3>
                <div className="map-page-holdings">
                  {holdings.map((holding) => (
                    <button
                      key={holding.key}
                      type="button"
                      className={holding.key === selectedKey ? 'map-page-holding selected' : 'map-page-holding'}
                      onClick={() => setSelectedKey(holding.key)}
                    >
                      <span className="map-page-holding-name">{holding.farmName}</span>
                      <span className="map-page-holding-area">
                        {formatArea(holding.hectaresMarked)} {t('farm.areaUnit')}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* What is being grown on the field that was clicked, rather than across the whole
                holding — the question the map raises is about that patch of ground. */}
            <h3 className="map-page-section">{t('map.growingOn', { land: details.farmName })}</h3>
            {details.crops.length === 0 ? (
              <p className="map-page-detail">{t('map.nothingRecorded')}</p>
            ) : (
              <div className="map-page-crops">
                {details.crops.map((crop, index) => (
                  <div key={`${crop.crop}-${index}`} className="map-page-crop">
                    <img src={cropImage(crop.crop)} alt="" className="map-page-crop-icon" />
                    <span className="map-page-crop-name">{crop.name.trim() || cropLabel(crop.crop, t)}</span>
                    <span className="map-page-crop-area">
                      {crop.area} {t('farm.areaUnit')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
