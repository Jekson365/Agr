import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { useConfiguration } from '@/contexts/configuration-context';
import { getFarms } from '@/services/farm-service';
import { getLivestock } from '@/services/livestock-service';
import { getStock } from '@/services/stock-service';
import type { Farm } from '@/types/farm';
import {
  isOnboardingDoneMarked,
  markOnboardingDone,
  requiredSteps,
  unfinishedSteps,
  type OnboardingData,
  type OnboardingStepKey,
} from './onboarding-status';

export type OnboardingCheck = {
  pending: boolean;
  steps: OnboardingStepKey[];
  unfinished: OnboardingStepKey[];
  farms: Farm[];
};

type CheckState = { data: OnboardingData | null; enforced: boolean };

export function useOnboardingStatus(): OnboardingCheck {
  const { user, isLoading } = useAuth();
  const { loaded, loadError, isOn } = useConfiguration();

  const steps = useMemo(() => requiredSteps(isOn), [isOn]);
  const [state, setState] = useState<CheckState | null>(null);

  const userId = user?.id ?? null;
  const managed = user?.hasManagementAccess !== false;

  useEffect(() => {
    if (isLoading || !loaded) return;

    if (userId === null || !managed || loadError || isOnboardingDoneMarked(userId)) {
      setState({ data: null, enforced: false });
      return;
    }

    let cancelled = false;
    setState(null);
    Promise.all([
      getFarms(),
      steps.includes('stock') ? getStock() : Promise.resolve([]),
      steps.includes('livestock') ? getLivestock() : Promise.resolve([]),
    ])
      .then(([farms, stock, livestock]) => {
        if (cancelled) return;
        setState({ data: { farms, stockCount: stock.length, livestockCount: livestock.length }, enforced: true });
      })
      .catch(() => {
        if (!cancelled) setState({ data: null, enforced: false });
      });

    return () => {
      cancelled = true;
    };
  }, [userId, managed, isLoading, loaded, loadError, steps]);

  const data = state?.enforced ? state.data : null;

  useEffect(() => {
    if (data && user && unfinishedSteps(steps, user, data).length === 0) {
      markOnboardingDone(user.id);
    }
  }, [data, user, steps]);

  return useMemo(() => {
    if (isLoading || !loaded || state === null) {
      return { pending: true, steps, unfinished: [], farms: [] };
    }
    if (!data || !user) {
      return { pending: false, steps, unfinished: [], farms: [] };
    }
    return { pending: false, steps, unfinished: unfinishedSteps(steps, user, data), farms: data.farms };
  }, [isLoading, loaded, state, data, steps, user]);
}
