import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useAuth } from '@/contexts/auth-context';
import { recordVisit } from '@/services/visit-service';
import { buildVisit } from './visit-identity';

const SETTLE_MS = 600;
const UNTRACKED_PREFIXES = ['/manager'];

export function VisitTracker() {
  const { pathname } = useLocation();
  const { isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || UNTRACKED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;
    const timer = window.setTimeout(() => {
      recordVisit(buildVisit(pathname)).catch(() => undefined);
    }, SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [pathname, isLoading]);

  return null;
}
