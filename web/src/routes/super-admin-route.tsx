import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/contexts/auth-context';
import { getAdminStatus } from '@/services/admin-service';

/**
 * Gates the manager page to platform operators.
 *
 * Unlike {@link OwnerRoute}, which compares an email in the browser and says so plainly, this one
 * **asks the server**. The stored session is a week old at worst and sits in localStorage where
 * anyone can edit it, so `user.isSuperAdmin` read from there decides only how fast the page gives
 * up — never whether the data arrives. Every endpoint behind this page checks the database again.
 *
 * Three states, and the difference matters: still asking, allowed, refused. Rendering the redirect
 * while the answer is in flight would bounce an operator off their own page on every refresh.
 */
export function SuperAdminRoute() {
  const { user, isLoading } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setAllowed(false);
      return;
    }

    let cancelled = false;
    getAdminStatus()
      .then((status) => !cancelled && setAllowed(status.isSuperAdmin))
      // A refused or failed check is not access. Erring the other way would flash the page's
      // shell — and its fetches — at someone who should never see either.
      .catch(() => !cancelled && setAllowed(false));

    return () => {
      cancelled = true;
    };
  }, [user, isLoading]);

  if (isLoading || allowed === null) {
    return null;
  }

  return allowed ? <Outlet /> : <Navigate to="/404" replace />;
}
