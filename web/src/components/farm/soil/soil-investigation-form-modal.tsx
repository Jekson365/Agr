import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { SOIL_GROUP_ORDER, SOIL_GROUP_TAB_LABEL_KEY } from '@/config/soil';
import { useLanguage } from '@/contexts/language-context';
import {
  createSoilInvestigation,
  updateSoilInvestigation,
  uploadSoilReport,
} from '@/services/soil-service';
import type { SoilInvestigationDetail, SoilParameterGroup, SoilReferenceData } from '@/types/soil';
import { draftFrom, emptyDraft, toInput, type InvestigationDraft, type ResultDraft } from './soil-draft';
import { validateDraft } from './soil-draft-validation';
import { SoilGeneralFields } from './soil-general-fields';
import { SoilParameterGroups } from './soil-parameter-groups';
import './soil.css';

type Props = {
  open: boolean;
  landPlotId: number;
  reference: SoilReferenceData;
  editing: SoilInvestigationDetail | null;
  onClose: () => void;
  onSaved: (detail: SoilInvestigationDetail, isNew: boolean) => void;
};

type Section = 'general' | SoilParameterGroup;

export function SoilInvestigationFormModal({
  open,
  landPlotId,
  reference,
  editing,
  onClose,
  onSaved,
}: Props) {
  const { t } = useLanguage();

  const [draft, setDraft] = useState<InvestigationDraft>(() => emptyDraft(reference));
  const [section, setSection] = useState<Section>('general');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editing != null;

  useEffect(() => {
    if (!open) return;
    setDraft(editing ? draftFrom(editing, reference) : emptyDraft(reference));
    setSection('general');
    setFormError(null);
  }, [open, editing, reference]);

  function patch(next: Partial<InvestigationDraft>) {
    setDraft((prev) => ({ ...prev, ...next }));
  }

  function patchResult(key: string, next: Partial<ResultDraft>) {
    setDraft((prev) => ({ ...prev, results: { ...prev.results, [key]: { ...prev.results[key], ...next } } }));
  }

  async function handleReport(file: File) {
    setUploading(true);
    setFormError(null);
    try {
      patch({ reportPath: await uploadSoilReport(file) });
    } catch {
      setFormError(t('soil.uploadError'));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    const problem = validateDraft(draft, reference);
    if (problem) {
      setFormError(t(problem));
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const input = toInput(landPlotId, draft, reference, editing?.investigation.id);
      const saved = isEditing
        ? await updateSoilInvestigation(editing.investigation.id, input)
        : await createSoilInvestigation(input);
      onSaved(saved, !isEditing);
      onClose();
    } catch {
      setFormError(t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  const sections: { key: Section; label: string }[] = [
    { key: 'general', label: t('soil.tabGeneral') },
    ...SOIL_GROUP_ORDER.filter((group) =>
      reference.parameters.some((parameter) => parameter.group === group)
    ).map((group) => ({ key: group as Section, label: t(SOIL_GROUP_TAB_LABEL_KEY[group]) })),
  ];

  return (
    <Modal open={open} onClose={onClose} size="wide">
      <h2 className="form-title">{isEditing ? t('soil.editInvestigation') : t('soil.addInvestigation')}</h2>

      <div className="soil-form-tabs">
        {sections.map((entry) => (
          <button
            key={entry.key}
            type="button"
            className={section === entry.key ? 'soil-tab active' : 'soil-tab'}
            aria-pressed={section === entry.key}
            onClick={() => setSection(entry.key)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="soil-form-body">
        {section === 'general' ? (
          <SoilGeneralFields draft={draft} uploading={uploading} onPatch={patch} onReport={handleReport} />
        ) : (
          <SoilParameterGroups draft={draft} reference={reference} onPatch={patchResult} only={section} />
        )}
      </div>

      {formError && <div className="error-banner">{formError}</div>}

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" onClick={handleSubmit} disabled={saving || uploading}>
          {isEditing ? t('common.save') : t('common.add')}
        </button>
      </div>
    </Modal>
  );
}
