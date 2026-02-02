import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'ADMIN' | 'DOCTOR' | 'SPECIALIST' | 'GENERAL';

export interface AuthUser {
  username: string;
  role: UserRole;
}

const CREDENTIALS: Array<{ username: string; password: string; role: UserRole }> = [
  { username: 'admin', password: 'admin', role: 'ADMIN' },
  { username: 'hekim', password: '123', role: 'DOCTOR' },
  { username: 'uzman', password: '123', role: 'SPECIALIST' },
  { username: 'genel', password: '123', role: 'GENERAL' },
];

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (username: string, password: string) => {
        const normalizedUsername = username.trim().toLowerCase();
        const entry = CREDENTIALS.find(
          (c) => c.username === normalizedUsername && c.password === password
        );
        if (entry) {
          set({
            isAuthenticated: true,
            user: { username: entry.username, role: entry.role },
          });
          return true;
        }
        return false;
      },
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: 'ohs-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);
