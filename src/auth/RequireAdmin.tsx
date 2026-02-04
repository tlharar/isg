import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@shared/stores/authStore';

interface RequireAdminProps {
  children: React.ReactNode;
}

/** Renders children only if current user is ADMIN; otherwise redirects to dashboard. */
export function RequireAdmin({ children }: RequireAdminProps) {
  const userRole = useAuthStore((s) => s.currentUser?.role);

  if (userRole !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
