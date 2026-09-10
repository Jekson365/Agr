import { formsFor } from '@/config/soil';
import type { SoilReferenceData } from '@/types/soil';
import { resultKey, type InvestigationDraft } from './soil-draft';

const PH_KEY = 'ph';
const PH_MIN = 0;
const PH_MAX = 14;

export function validateDraft(draft: InvestigationDraft, reference: SoilReferenceData): string | null {
  if (!draft.investigationDate) return 'soil.errorDateRequired';

  if (draft.samplingDepthCm.trim()) {
    const depth = Number(draft.samplingDepthCm);
    if (!Number.isFinite(depth) || depth <= 0) return 'soil.errorDepth';
  }

  for (const parameter of reference.parameters) {
    if (parameter.valueKind !== 'Numeric') continue;

    for (const form of formsFor(parameter.supportsForms)) {
      const entry = draft.results[resultKey(parameter.id, form)];
      const raw = entry?.value.trim();
      if (!raw) continue;

      const value = Number(raw);
      if (!Number.isFinite(value)) return 'soil.errorNumeric';
      if (value < 0) return 'soil.errorNegative';
      if (parameter.key === PH_KEY && (value < PH_MIN || value > PH_MAX)) return 'soil.errorPhRange';
    }
  }

  return null;
}
