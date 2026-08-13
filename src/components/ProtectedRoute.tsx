import { Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { ReactNode } from 'react';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <main className="admin-auth-loading" aria-live="polite">Checking workspace session…</main>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  return <>{children}</>;
}
