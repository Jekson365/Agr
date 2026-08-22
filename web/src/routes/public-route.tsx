import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/contexts/auth-context';
import { homePathFor } from '@/routes/home-path';

/** Wraps routes that signed-in users shouldn't see (e.g. /login) and bounces them to the app. */
export function PublicOnlyRoute() {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return null;
  }

  return isAuthenticated ? <Navigate to={homePathFor(user)} replace /> : <Outlet />;
}
