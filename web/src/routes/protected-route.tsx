import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/contexts/auth-context';

export function ProtectedRoute() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return null;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
