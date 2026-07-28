import { useEffect, useState } from 'react';

import { CardMenu } from '@/components/farm/card-menu';
import { PlusIcon } from '@/components/icons/misc-icons';
import { Modal } from '@/components/ui/modal';
import { stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import {
  createGreenhouseFloor,
  deleteGreenhouseFloor,
  getGreenhouseFloors,
  updateGreenhouseFloor,
} from '@/services/greenhouse-floor-service';
import {
  createGreenhouseSection,
  deleteGreenhouseSection,
  getGreenhouseSections,
  updateGreenhouseSection,
} from '@/services/greenhouse-section-service';
import {
  getGreenhouseSectionStockForFloor,
  setGreenhouseSectionStock,
  type GreenhouseSectionStock as GreenhouseSectionStockLink,
} from '@/services/greenhouse-section-stock-service';
import { getGreenhouse, updateGreenhouse } from '@/services/greenhouse-service';
import { getGreenhouseStock } from '@/services/greenhouse-stock-service';
import type { Greenhouse } from '@/types/greenhouse';
import type { GreenhouseFloor } from '@/types/greenhouse-floor';
import type { GreenhouseSection } from '@/types/greenhouse-section';
import type { GreenhouseStock } from '@/types/greenhouse-stock';

import { FloorCanvas, type SectionDraft } from './floor-canvas';
import './greenhouse-positioning.css';

/** Groups flat section-stock links into a sectionId → stockIds map. */
function groupBySection(links: GreenhouseSectionStockLink[]): Record<number, number[]> {
  const map: Record<number, number[]> = {};
  for (const link of links) {
    (map[link.greenhouseSectionId] ??= []).push(link.greenhouseStockId);
  }
  return map;
}

type Props = {
  greenhouseId: number;
  open: boolean;
  onClose: () => void;
};

/** Pixels per world unit at 100% — the reference the zoom-percent readout is computed against. */
const DEFAULT_ZOOM = 40;
/** The editor opens zoomed out to 16% so a whole greenhouse is visible before the user zooms in. */
const INITIAL_ZOOM = DEFAULT_ZOOM * 0.16;
const MIN_ZOOM = 5;
const MAX_ZOOM = 200;
/** Fresh section size, in world units — small enough to fit almost any greenhouse, clamped
 * further against the actual footprint when one is created. */
const NEW_AREA_SIZE = 2;

export function GreenhousePositioningModal({ greenhouseId, open, onClose }: Props) {
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [greenhouse, setGreenhouse] = useState<Greenhouse | null>(null);
  const [widthInput, setWidthInput] = useState('0');
  const [lengthInput, setLengthInput] = useState('0');
  const [heightInput, setHeightInput] = useState('0');

  const [floors, setFloors] = useState<GreenhouseFloor[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [sections, setSections] = useState<GreenhouseSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);

  const [stocks, setStocks] = useState<GreenhouseStock[]>([]);
  /** sectionId → the ids of stock kinds planted there, for the current floor. */
  const [sectionStockIds, setSectionStockIds] = useState<Record<number, number[]>>({});

  const [editingFloorId, setEditingFloorId] = useState<number | null>(null);
  const [editingFloorName, setEditingFloorName] = useState('');

  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [pan, setPan] = useState({ x: 60, y: 60 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);

  useEffect(() => {
    if (open) {
      void load();
    } else {
      resetState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function resetState() {
    setLoading(true);
    setError(null);
    setSaveError(null);
    setGreenhouse(null);
    setFloors([]);
    setSelectedFloorId(null);
    setSections([]);
    setSelectedSectionId(null);
    setStocks([]);
    setSectionStockIds({});
    setEditingFloorId(null);
    setZoom(INITIAL_ZOOM);
    setPan({ x: 60, y: 60 });
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [greenhouseItem, floorList, stockList] = await Promise.all([
        getGreenhouse(greenhouseId),
        getGreenhouseFloors(greenhouseId),
        getGreenhouseStock(greenhouseId),
      ]);
      setGreenhouse(greenhouseItem);
      setWidthInput(String(greenhouseItem.width));
      setLengthInput(String(greenhouseItem.length));
      setHeightInput(String(greenhouseItem.height));
      setFloors(floorList);
      setStocks(stockList);

      if (floorList.length > 0) {
        await selectFloor(floorList[0].id);
      } else {
        setSelectedFloorId(null);
        setSections([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function selectFloor(floorId: number) {
    setSelectedFloorId(floorId);
    setSelectedSectionId(null);
    try {
      const [sectionList, plantings] = await Promise.all([
        getGreenhouseSections(floorId),
        getGreenhouseSectionStockForFloor(floorId),
      ]);
      setSections(sectionList);
      setSectionStockIds(groupBySection(plantings));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const width = Number(widthInput) || 0;
  const length = Number(lengthInput) || 0;
  const hasDimensions = width > 0 && length > 0;
  const selectedSection = sections.find((s) => s.id === selectedSectionId) ?? null;

  async function handleAddFloor() {
    setSaveError(null);
    try {
      const created = await createGreenhouseFloor({
        greenhouseId,
        name: t('greenhouse.positioning.floorDefaultName', { n: floors.length + 1 }),
      });
      setFloors((prev) => [...prev, created]);
      await selectFloor(created.id);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    }
  }

  function startRenameFloor(floor: GreenhouseFloor) {
    setEditingFloorId(floor.id);
    setEditingFloorName(floor.name);
  }

  async function commitRenameFloor(floor: GreenhouseFloor) {
    const name = editingFloorName.trim();
    setEditingFloorId(null);
    if (!name || name === floor.name) return;
    setSaveError(null);
    try {
      await updateGreenhouseFloor(floor.id, { ...floor, name });
      setFloors((prev) => prev.map((f) => (f.id === floor.id ? { ...f, name } : f)));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleDeleteFloor(floor: GreenhouseFloor) {
    setSaveError(null);
    try {
      await deleteGreenhouseFloor(floor.id);
      const remaining = floors.filter((f) => f.id !== floor.id);
      setFloors(remaining);
      if (selectedFloorId === floor.id) {
        if (remaining.length > 0) {
          await selectFloor(remaining[0].id);
        } else {
          setSelectedFloorId(null);
          setSections([]);
          setSelectedSectionId(null);
        }
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleNewArea() {
    if (!selectedFloorId || !hasDimensions) return;
    setSaveError(null);
    const size = Math.min(NEW_AREA_SIZE, width, length);
    try {
      const created = await createGreenhouseSection({
        greenhouseFloorId: selectedFloorId,
        name: t('greenhouse.positioning.areaDefaultName', { n: sections.length + 1 }),
        x: Math.max(0, (width - size) / 2),
        y: Math.max(0, (length - size) / 2),
        width: size,
        height: size,
        rotation: 0,
      });
      setSections((prev) => [...prev, created]);
      setSelectedSectionId(created.id);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    }
  }

  function updateSectionLocal(id: number, draft: SectionDraft) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...draft } : s)));
  }

  async function persistSection(id: number, draft: SectionDraft) {
    updateSectionLocal(id, draft);
    const section = sections.find((s) => s.id === id);
    if (!section) return;
    setSaveError(null);
    try {
      await updateGreenhouseSection(id, { ...section, ...draft });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
      // The server is the source of truth for placement — resync so a rejected move (e.g. an
      // edge case the client's own boundary clamp didn't catch) doesn't leave the canvas showing
      // a position that was never actually saved.
      if (selectedFloorId) {
        try {
          setSections(await getGreenhouseSections(selectedFloorId));
        } catch {
          // Best-effort resync only; the next explicit action will surface any deeper problem.
        }
      }
    }
  }

  async function handleRenameSection(name: string) {
    if (!selectedSection || !name.trim() || name.trim() === selectedSection.name) return;
    const trimmed = name.trim();
    setSections((prev) => prev.map((s) => (s.id === selectedSection.id ? { ...s, name: trimmed } : s)));
    setSaveError(null);
    try {
      await updateGreenhouseSection(selectedSection.id, { ...selectedSection, name: trimmed });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleDeleteSection(id: number) {
    setSaveError(null);
    try {
      await deleteGreenhouseSection(id);
      setSections((prev) => prev.filter((s) => s.id !== id));
      setSectionStockIds((prev) => {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      });
      if (selectedSectionId === id) setSelectedSectionId(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    }
  }

  async function toggleSectionStock(sectionId: number, stockId: number) {
    const current = sectionStockIds[sectionId] ?? [];
    const next = current.includes(stockId) ? current.filter((id) => id !== stockId) : [...current, stockId];
    setSectionStockIds((prev) => ({ ...prev, [sectionId]: next }));
    setSaveError(null);
    try {
      await setGreenhouseSectionStock(sectionId, next);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
      // Resync with the server rather than leave a checkbox showing a state that didn't save.
      if (selectedFloorId) {
        try {
          setSectionStockIds(groupBySection(await getGreenhouseSectionStockForFloor(selectedFloorId)));
        } catch {
          // Best-effort resync only; the next explicit action will surface any deeper problem.
        }
      }
    }
  }

  async function handleSave() {
    if (!greenhouse) {
      onClose();
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const updated: Greenhouse = {
        ...greenhouse,
        width: Math.max(0, Number(widthInput) || 0),
        length: Math.max(0, Number(lengthInput) || 0),
        height: Math.max(0, Number(heightInput) || 0),
      };
      await updateGreenhouse(greenhouseId, updated);
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  function zoomBy(factor: number) {
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor)));
  }

  const sectionIcons: Record<number, string[]> = {};
  for (const section of sections) {
    const ids = sectionStockIds[section.id];
    if (!ids || ids.length === 0) continue;
    sectionIcons[section.id] = ids
      .map((id) => stocks.find((s) => s.id === id))
      .filter((s): s is GreenhouseStock => s != null)
      .map((s) => stockKindImage(s.type));
  }

  return (
    <Modal open={open} onClose={onClose} size="full">
      <div className="gh-positioning">
        <div className="gh-positioning-toolbar">
          <h2 className="gh-positioning-title">{t('greenhouse.positioning.title')}</h2>
          <div className="gh-positioning-toolbar-actions">
            <button type="button" className="gh-toolbar-btn" onClick={() => zoomBy(1 / 1.2)} aria-label={t('greenhouse.positioning.zoomOut')}>
              −
            </button>
            <button
              type="button"
              className="gh-toolbar-btn"
              onClick={() => {
                setZoom(INITIAL_ZOOM);
                setPan({ x: 60, y: 60 });
              }}
              aria-label={t('greenhouse.positioning.zoomReset')}
            >
              {Math.round((zoom / DEFAULT_ZOOM) * 100)}%
            </button>
            <button type="button" className="gh-toolbar-btn" onClick={() => zoomBy(1.2)} aria-label={t('greenhouse.positioning.zoomIn')}>
              +
            </button>
            <button
              type="button"
              className={showGrid ? 'gh-toolbar-btn active' : 'gh-toolbar-btn'}
              onClick={() => setShowGrid((v) => !v)}
            >
              {t('greenhouse.positioning.grid')}
            </button>
            <button
              type="button"
              className={snapToGrid ? 'gh-toolbar-btn active' : 'gh-toolbar-btn'}
              onClick={() => setSnapToGrid((v) => !v)}
            >
              {t('greenhouse.positioning.snap')}
            </button>
            <button type="button" className="btn-secondary gh-toolbar-action" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn gh-toolbar-action" onClick={handleSave} disabled={saving}>
              {t('common.save')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="state-box">…</div>
        ) : error ? (
          <div className="state-box">
            <span>{t('greenhouse.positioning.loadError')}</span>
            <button type="button" className="retry-button" onClick={load}>
              {t('common.retry')}
            </button>
          </div>
        ) : (
          <div className="gh-positioning-body">
            <div className="gh-positioning-panel">
              {saveError && <div className="error-banner">{saveError}</div>}

              <section className="gh-positioning-section">
                <h3>{t('greenhouse.positioning.dimensions')}</h3>
                <p className="gh-positioning-hint">{t('greenhouse.positioning.dimensionsHint')}</p>
                <div className="field-row">
                  <div className="field">
                    <label>{t('greenhouse.positioning.width')}</label>
                    <input type="number" min="0" step="0.1" value={widthInput} onChange={(e) => setWidthInput(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>{t('greenhouse.positioning.length')}</label>
                    <input type="number" min="0" step="0.1" value={lengthInput} onChange={(e) => setLengthInput(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>{t('greenhouse.positioning.height')}</label>
                    <input type="number" min="0" step="0.1" value={heightInput} onChange={(e) => setHeightInput(e.target.value)} />
                  </div>
                </div>
              </section>

              <section className="gh-positioning-section">
                <div className="gh-positioning-section-header">
                  <h3>{t('greenhouse.positioning.floors')}</h3>
                  <button type="button" className="gh-icon-btn" onClick={handleAddFloor} aria-label={t('greenhouse.positioning.addFloor')}>
                    <PlusIcon width={16} height={16} />
                  </button>
                </div>

                {floors.length === 0 ? (
                  <p className="empty-state">{t('greenhouse.positioning.noFloors')}</p>
                ) : (
                  <div className="gh-floor-list">
                    {floors.map((floor) => (
                      <div key={floor.id} className={floor.id === selectedFloorId ? 'gh-floor-row selected' : 'gh-floor-row'}>
                        {editingFloorId === floor.id ? (
                          <input
                            className="gh-floor-rename-input"
                            autoFocus
                            value={editingFloorName}
                            onChange={(e) => setEditingFloorName(e.target.value)}
                            onBlur={() => commitRenameFloor(floor)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.currentTarget.blur();
                              if (e.key === 'Escape') setEditingFloorId(null);
                            }}
                          />
                        ) : (
                          <button type="button" className="gh-floor-name" onClick={() => selectFloor(floor.id)}>
                            {floor.name}
                          </button>
                        )}
                        <CardMenu onEdit={() => startRenameFloor(floor)} onDelete={() => handleDeleteFloor(floor)} />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="gh-positioning-section">
                <button
                  type="button"
                  className="btn gh-new-area-btn"
                  onClick={handleNewArea}
                  disabled={!selectedFloorId || !hasDimensions}
                  title={!hasDimensions ? t('greenhouse.positioning.needsDimensions') : undefined}
                >
                  <PlusIcon width={16} height={16} />
                  {t('greenhouse.positioning.newArea')}
                </button>
                {!hasDimensions && <p className="gh-positioning-hint">{t('greenhouse.positioning.needsDimensions')}</p>}
              </section>

              <section className="gh-positioning-section">
                <h3>{t('greenhouse.positioning.properties')}</h3>
                {selectedSection ? (
                  <div className="gh-section-properties">
                    <div className="field">
                      <label>{t('greenhouse.positioning.name')}</label>
                      <input
                        value={selectedSection.name}
                        onChange={(e) => setSections((prev) => prev.map((s) => (s.id === selectedSection.id ? { ...s, name: e.target.value } : s)))}
                        onBlur={(e) => handleRenameSection(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                      />
                    </div>
                    <div className="field-row">
                      <div className="field">
                        <label>X</label>
                        <input
                          type="number"
                          step="0.1"
                          value={selectedSection.x}
                          onChange={(e) => updateSectionLocal(selectedSection.id, { ...selectedSection, x: Number(e.target.value) })}
                          onBlur={() => persistSection(selectedSection.id, selectedSection)}
                        />
                      </div>
                      <div className="field">
                        <label>Y</label>
                        <input
                          type="number"
                          step="0.1"
                          value={selectedSection.y}
                          onChange={(e) => updateSectionLocal(selectedSection.id, { ...selectedSection, y: Number(e.target.value) })}
                          onBlur={() => persistSection(selectedSection.id, selectedSection)}
                        />
                      </div>
                    </div>
                    <div className="field-row">
                      <div className="field">
                        <label>W</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={selectedSection.width}
                          onChange={(e) => updateSectionLocal(selectedSection.id, { ...selectedSection, width: Number(e.target.value) })}
                          onBlur={() => persistSection(selectedSection.id, selectedSection)}
                        />
                      </div>
                      <div className="field">
                        <label>H</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={selectedSection.height}
                          onChange={(e) => updateSectionLocal(selectedSection.id, { ...selectedSection, height: Number(e.target.value) })}
                          onBlur={() => persistSection(selectedSection.id, selectedSection)}
                        />
                      </div>
                    </div>
                    <div className="field">
                      <label>{t('greenhouse.positioning.rotation')}</label>
                      <input
                        type="number"
                        step="1"
                        value={selectedSection.rotation}
                        onChange={(e) => updateSectionLocal(selectedSection.id, { ...selectedSection, rotation: Number(e.target.value) })}
                        onBlur={() => persistSection(selectedSection.id, selectedSection)}
                      />
                    </div>
                    <div className="field">
                      <label>{t('greenhouse.positioning.plantedStock')}</label>
                      {stocks.length === 0 ? (
                        <p className="gh-positioning-hint">{t('greenhouse.positioning.noStock')}</p>
                      ) : (
                        <div className="gh-stock-checklist">
                          {stocks.map((stock) => {
                            const checked = (sectionStockIds[selectedSection.id] ?? []).includes(stock.id);
                            const label = stock.name.trim() || stockTypeLabel(stock.type, t);
                            return (
                              <label key={stock.id} className="gh-stock-check-row">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleSectionStock(selectedSection.id, stock.id)}
                                />
                                <img src={stockKindImage(stock.type)} alt="" className="gh-stock-check-icon" />
                                <span>{label}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <button type="button" className="gh-delete-area-btn" onClick={() => handleDeleteSection(selectedSection.id)}>
                      {t('common.delete')}
                    </button>
                  </div>
                ) : (
                  <p className="empty-state">{t('greenhouse.positioning.noSelection')}</p>
                )}
              </section>
            </div>

            <div className="gh-positioning-canvas-wrap">
              <FloorCanvas
                greenhouseWidth={width}
                greenhouseLength={length}
                sections={sections}
                selectedSectionId={selectedSectionId}
                onSelect={setSelectedSectionId}
                onLiveChange={updateSectionLocal}
                onCommit={persistSection}
                zoom={zoom}
                onZoomChange={setZoom}
                pan={pan}
                onPanChange={setPan}
                showGrid={showGrid}
                snapToGrid={snapToGrid}
                sectionIcons={sectionIcons}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
