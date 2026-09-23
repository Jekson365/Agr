import { useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { toIsoDate } from '@/components/ui/date-utils';
import { TREE_TREATMENTS, treeTreatmentColour, treeTreatmentLabel } from '@/config/tree-treatment';
import { useLanguage } from '@/contexts/language-context';
import { createTreeSpotTreatments } from '@/services/tree-spot-treatment-service';
import type { TreeSpotTreatment } from '@/types/tree-spot-treatment';
import type { PickedTree } from './treatment-plan-shape';
import './treatment-spot.css';

type Props = {
  open: boolean;
  treeStockId: number;
  trees: PickedTree[];
  onClose: () => void;
  onSaved: (rows: TreeSpotTreatment[]) => void;
};

export function TreatmentSpotForm({ open, treeStockId, trees, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [date, setDate] = useState(() => toIsoDate(new Date()));
  const [type, setType] = useState<string>(TREE_TREATMENTS[0]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!date || trees.length === 0) return;

    setSaving(true);
    setError(null);
    try {
      const rows = await createTreeSpotTreatments({
        treeStockId,
        date,
        type,
        note: note.trim(),
        trees: trees.map((tree) => ({ index: tree.index, latitude: tree.lat, longitude: tree.lng })),
      });
      onSaved(rows);
      setNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{t('treatment.spotTitle')}</h2>
      <p className="modal-body-text">{t('treatment.selectedTrees', { count: trees.length })}</p>

      {error && <div className="error-banner">{error}</div>}

      <div className="form-fields">
        <div className="field">
          <label>{t('treatment.spotType')}</label>
          <div className="kind-row">
            {TREE_TREATMENTS.map((option) => (
              <button
                key={option}
                type="button"
                className={type === option ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setType(option)}
              >
                <span className="trt-swatch trt-spot-swatch" style={{ background: treeTreatmentColour(option) }} />
                <span>{treeTreatmentLabel(option, t)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>{t('treatment.spotDate')}</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="field">
          <label>{t('treatment.spotNote')}</label>
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>

      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" disabled={saving || !date || trees.length === 0} onClick={save}>
          {t('common.save')}
        </button>
      </div>
    </Modal>
  );
}
