import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';

interface AuthState {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      login: (username: string, password: string) => {
        const success =
          username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
        if (success) set({ isAuthenticated: true });
        return success;
      },
      logout: () => set({ isAuthenticated: false }),
    }),
    {
      name: 'ohs-auth',
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    }
  )
);
