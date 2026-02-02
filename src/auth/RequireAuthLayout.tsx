import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@shared/stores/authStore';
import { ShellLayout } from '@shell/layout/ShellLayout';

export function RequireAuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <ShellLayout />;
}
