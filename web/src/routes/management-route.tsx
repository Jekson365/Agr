import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/contexts/auth-context';

/**
 * The farm software, for the accounts that have it.
 *
 * An account registered from the marketplace signs in with the same credentials but has no farm
 * to manage, so it lands on the marketplace instead of a dashboard with nothing behind it. The
 * server refuses those requests too — this only decides what renders.
 */
export function ManagementRoute() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return null;
  }

  return user?.hasManagementAccess === false ? <Navigate to="/market" replace /> : <Outlet />;
}
