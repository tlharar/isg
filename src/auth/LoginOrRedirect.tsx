import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@shared/stores/authStore';
import { LoginPage } from '@pages/LoginPage';

export function LoginOrRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage />;
}
