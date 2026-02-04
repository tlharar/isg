import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@shared/stores/authStore';
import { SignUpPage } from '@pages/SignUpPage';

export function SignUpOrRedirect() {
  const isAuthenticated = useAuthStore((s) => s.currentUser != null);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <SignUpPage />;
}
