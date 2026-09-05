import { Navigate, Outlet } from 'react-router-dom';

import { useOnboardingStatus } from '@/pages/onboarding/use-onboarding-status';

export function OnboardingRoute() {
  const { pending, unfinished } = useOnboardingStatus();

  if (pending) {
    return null;
  }

  return unfinished.length === 0 ? <Outlet /> : <Navigate to="/onboarding" replace />;
}
