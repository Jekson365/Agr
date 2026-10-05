import { useCallback, useEffect, useState } from 'react';

import reportIcon from '@/assets/icons/report.png';
import { LineChart, type LinePoint } from '@/components/charts/line-chart';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { readingSummary, shortDay } from '@/config/wine-readings';
import { useLanguage } from '@/contexts/language-context';
import { HarvestEntryList, type EntryRow } from '@/pages/harvest/detail/harvest-entry-list';
import { deleteWineMeasurement, getWineMeasurements } from '@/services/wine-measurement-service';
import type { WineMeasurement } from '@/types/wine';
import { WineReadingFormModal } from './wine-reading-form-modal';

type Props = {
  batchId: number;
  canEdit: boolean;
  onChanged: () => void;
};

export function WineReadingsSection({ batchId, canEdit, onChanged }: Props) {
  const { t, language } = useLanguage();

  const [readings, setReadings] = useState<WineMeasurement[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WineMeasurement | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; label: string } | null>(null);

  const load = useCallback(async () => {
    setReadings(await getWineMeasurements(batchId));
  }, [batchId]);

  useEffect(() => {
    load().catch(() => setReadings([]));
  }, [load]);

  async function reload() {
    await load();
    onChanged();
  }

  function series(pick: (row: WineMeasurement) => number | null): LinePoint[] {
    return readings.flatMap((row) => {
      const value = pick(row);
      return value == null ? [] : [{ key: String(row.id), label: shortDay(row.date), value }];
    });
  }

  const charts = [
    { key: 'sugar', title: t('wine.sugarChart'), unit: '%', points: series((row) => row.sugar) },
    { key: 'temperature', title: t('wine.temperatureChart'), unit: '°C', points: series((row) => row.temperature) },
  ];

  const rows: EntryRow[] = [...readings].reverse().map((row) => ({
    id: row.id,
    icon: reportIcon,
    title: formatLocalizedIsoDate(row.date, language),
    amount: readingSummary(row, t) + (row.note ? ` — ${row.note}` : ''),
    removed: false,
  }));

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await deleteWineMeasurement(confirmDelete.id);
      await reload();
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <>
      <div className="wine-chart-grid">
        {charts.map((chart) => (
          <section key={chart.key} className="hd-panel">
            <h2 className="hd-panel-title">{chart.title}</h2>
            {chart.points.length >= 2 ? (
              <LineChart points={chart.points} unit={chart.unit} ariaLabel={chart.title} />
            ) : (
              <p className="hd-empty">{t('wine.chartNeedsTwo')}</p>
            )}
          </section>
        ))}
      </div>

      <HarvestEntryList
        title={t('wine.readingsTitle')}
        note={t('wine.readingsHint')}
        rows={rows}
        emptyText={t('wine.readingsEmpty')}
        addLabel={t('wine.readingAdd')}
        canEdit={canEdit}
        scrollable
        onAdd={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        onEdit={(id) => {
          setEditing(readings.find((row) => row.id === id) ?? null);
          setFormOpen(true);
        }}
        onDelete={(id) => setConfirmDelete({ id, label: rows.find((row) => row.id === id)?.title ?? '' })}
      />

      <WineReadingFormModal
        open={formOpen}
        batchId={batchId}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.label ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
