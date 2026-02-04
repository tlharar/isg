import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole =
  | 'Admin'
  | 'Hekim'
  | 'IsgUzman'
  | 'GenelKullanici'
  | 'DemoHekim'
  | 'DemoUzman'
  | 'DemoGenel';

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
}

function generateUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_ADMIN: User = {
  id: 'user-admin-default',
  email: 'admin@demo.com',
  password: '123456',
  firstName: 'Sistem',
  lastName: 'Yöneticisi',
  phone: '',
  role: 'Admin',
};

const INITIAL_USERS: User[] = [
  DEFAULT_ADMIN,
];

interface AuthState {
  currentUser: User | null;
  users: User[];
  login: (email: string, password: string) => User | null;
  logout: () => void;
  addUser: (data: Omit<User, 'id'>) => User | null;
  deleteUser: (id: string) => boolean;
  getUserById: (id: string) => User | undefined;
  changePassword: (newPassword: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: INITIAL_USERS,

      login: (email: string, password: string) => {
        const normalizedEmail = email.trim().toLowerCase();
        const user = get().users.find(
          (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
        );
        if (user) {
          set({ currentUser: user });
          return user;
        }
        return null;
      },

      logout: () => set({ currentUser: null }),

      addUser: (data) => {
        const current = get().currentUser;
        if (!current || current.role !== 'Admin') return null;
        const existing = get().users.some((u) => u.email.toLowerCase() === data.email.trim().toLowerCase());
        if (existing) return null;
        const user: User = {
          ...data,
          id: generateUserId(),
        };
        set((s) => ({ users: [user, ...s.users] }));
        return user;
      },

      deleteUser: (id: string) => {
        const current = get().currentUser;
        if (!current || current.role !== 'Admin') return false;
        const target = get().users.find((u) => u.id === id);
        if (!target || target.role === 'Admin') return false;
        set((s) => ({
          users: s.users.filter((u) => u.id !== id),
          currentUser: s.currentUser?.id === id ? null : s.currentUser,
        }));
        return true;
      },

      getUserById: (id) => get().users.find((u) => u.id === id),

      changePassword: (newPassword: string) => {
        const current = get().currentUser;
        if (!current || !newPassword.trim()) return false;
        const updatedUser = { ...current, password: newPassword.trim() };
        set((s) => ({
          currentUser: updatedUser,
          users: s.users.map((u) => (u.id === current.id ? updatedUser : u)),
        }));
        return true;
      },
    }),
    {
      name: 'ohs-auth',
      partialize: (s) => ({ users: s.users, currentUser: s.currentUser }),
    }
  )
);

/** Backward compatibility: derive isAuthenticated and user for components that still use them. */
export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => s.currentUser != null);
}

/** For NavContent / RequireAdmin: use currentUser. */
export function useCurrentUser(): User | null {
  return useAuthStore((s) => s.currentUser);
}
