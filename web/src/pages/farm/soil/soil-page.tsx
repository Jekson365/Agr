import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { SoilInvestigationFormModal } from '@/components/farm/soil/soil-investigation-form-modal';
import '@/components/farm/soil/soil.css';
import { cropImage, cropLabel } from '@/config/crop';
import { useLanguage } from '@/contexts/language-context';
import { deleteSoilInvestigation, getSoilFertilityHistory } from '@/services/soil-service';
import type {
  SoilFertilityAssessmentDetail,
  SoilInvestigation,
  SoilInvestigationDetail,
} from '@/types/soil';
import { SoilComparePanel } from './soil-compare-panel';
import { SoilFertilityPanel } from './soil-fertility-panel';
import { SoilHistoryPanel } from './soil-history-panel';
import { SoilInvestigationList } from './soil-investigation-list';
import { SoilOverviewPanel } from './soil-overview-panel';
import { useSoilPlot } from './use-soil-plot';

type Tab = 'overview' | 'investigations' | 'fertility' | 'history' | 'compare';

const TABS: { key: Tab; labelKey: string }[] = [
  { key: 'overview', labelKey: 'soil.tabOverview' },
  { key: 'investigations', labelKey: 'soil.tabInvestigations' },
  { key: 'fertility', labelKey: 'soil.tabFertility' },
  { key: 'history', labelKey: 'soil.tabHistory' },
  { key: 'compare', labelKey: 'soil.tabCompare' },
];

export function SoilPage() {
  const { t } = useLanguage();
  const { id: farmParam, plotId: plotParam } = useParams<{ id: string; plotId: string }>();
  const farmId = Number(farmParam);
  const plotId = Number(plotParam);

  const soil = useSoilPlot(plotId);
  const { plot, reference, investigations, history, loading, error, loadPair } = soil;

  const [tab, setTab] = useState<Tab>('overview');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<SoilFertilityAssessmentDetail | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SoilInvestigationDetail | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SoilInvestigation | null>(null);

  const activeId = selectedId ?? investigations[0]?.id ?? null;

  useEffect(() => {
    if (activeId == null) {
      setSelected(null);
      return;
    }

    let cancelled = false;
    loadPair(activeId)
      .then((pair) => {
        if (!cancelled) setSelected(pair.assessment);
      })
      .catch(() => {
        if (!cancelled) setSelected(null);
      });

    return () => {
      cancelled = true;
    };
  }, [activeId, loadPair]);

  async function openEdit(id: number) {
    const pair = await loadPair(id).catch(() => null);
    if (!pair) return;
    setEditing(pair.detail);
    setFormOpen(true);
  }

  async function handleSaved(detail: SoilInvestigationDetail, isNew: boolean) {
    soil.setInvestigations((prev) =>
      isNew
        ? [detail.investigation, ...prev].sort((a, b) => b.investigationDate.localeCompare(a.investigationDate))
        : prev.map((row) => (row.id === detail.investigation.id ? detail.investigation : row))
    );
    setSelectedId(detail.investigation.id);
    soil.setHistory(await getSoilFertilityHistory(plotId).catch(() => history));
  }

  async function confirmDeleteInvestigation() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    setConfirmDelete(null);
    try {
      await deleteSoilInvestigation(id);
      soil.setInvestigations((prev) => prev.filter((row) => row.id !== id));
      soil.setHistory((prev) => prev.filter((row) => row.soilInvestigationId !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (err) {
      soil.setError(err instanceof Error ? err.message : String(err));
    }
  }

  const latest = investigations[0] ?? null;

  return (
    <div className="page">
      <Link to={`/farm/land/${farmId}`} className="back-link">
        {t('farm.land')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{plot ? cropLabel(plot.crop, t) : t('soil.title')}</h1>
        <button
          type="button"
          className="add-button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          + {t('soil.addInvestigation')}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="state-box">…</div>
      ) : (
        <>
          {plot && (
            <div className="soil-plot-head">
              <img src={cropImage(plot.crop)} alt="" />
              <span className="soil-plot-area">
                {plot.area} {t('farm.areaUnit')}
              </span>
            </div>
          )}

          <div className="soil-tabs">
            {TABS.map((entry) => (
              <button
                key={entry.key}
                type="button"
                className={tab === entry.key ? 'soil-tab active' : 'soil-tab'}
                onClick={() => setTab(entry.key)}
              >
                {t(entry.labelKey)}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <SoilOverviewPanel
              latest={latest}
              assessment={selected}
              reference={reference}
              count={investigations.length}
            />
          )}

          {tab === 'investigations' && (
            <SoilInvestigationList
              investigations={investigations}
              selectedId={activeId}
              onSelect={setSelectedId}
              onEdit={openEdit}
              onDelete={setConfirmDelete}
            />
          )}

          {tab === 'fertility' && <SoilFertilityPanel detail={selected} reference={reference} />}

          {tab === 'history' && (
            <SoilHistoryPanel assessments={history} investigations={investigations} reference={reference} />
          )}

          {tab === 'compare' && (
            <SoilComparePanel investigations={investigations} reference={reference} load={loadPair} />
          )}
        </>
      )}

      <SoilInvestigationFormModal
        open={formOpen}
        landPlotId={plotId}
        reference={reference}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.investigationDate ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteInvestigation}
      />
    </div>
  );
}
