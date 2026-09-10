import { useCallback, useEffect, useState } from 'react';

import { getLandPlot } from '@/services/land-plot-service';
import {
  getSoilAssessment,
  getSoilFertilityHistory,
  getSoilInvestigation,
  getSoilInvestigations,
  getSoilReference,
} from '@/services/soil-service';
import type { LandPlot } from '@/types/land-plot';
import type {
  SoilFertilityAssessment,
  SoilFertilityAssessmentDetail,
  SoilInvestigation,
  SoilInvestigationDetail,
  SoilReferenceData,
} from '@/types/soil';

const EMPTY: SoilReferenceData = {
  ruleSet: null,
  parameters: [],
  categories: [],
  factors: [],
  fertilityCategories: [],
};

export type SoilPair = {
  detail: SoilInvestigationDetail;
  assessment: SoilFertilityAssessmentDetail | null;
};

export function useSoilPlot(plotId: number) {
  const [plot, setPlot] = useState<LandPlot | null>(null);
  const [reference, setReference] = useState<SoilReferenceData>(EMPTY);
  const [investigations, setInvestigations] = useState<SoilInvestigation[]>([]);
  const [history, setHistory] = useState<SoilFertilityAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [plotRow, referenceData, list, assessments] = await Promise.all([
        getLandPlot(plotId),
        getSoilReference(),
        getSoilInvestigations(plotId),
        getSoilFertilityHistory(plotId),
      ]);
      setPlot(plotRow);
      setReference(referenceData);
      setInvestigations(list);
      setHistory(assessments);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [plotId]);

  useEffect(() => {
    if (plotId) load();
  }, [plotId, load]);

  const loadPair = useCallback(async (investigationId: number): Promise<SoilPair> => {
    const detail = await getSoilInvestigation(investigationId);
    const assessment = await getSoilAssessment(investigationId).catch(() => null);
    return { detail, assessment };
  }, []);

  return {
    plot,
    reference,
    investigations,
    setInvestigations,
    history,
    setHistory,
    loading,
    error,
    setError,
    load,
    loadPair,
  };
}
