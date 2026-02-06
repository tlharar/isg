import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sendWelcomeEmail } from '@/services/emailService';

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
  /** If set and today > this date, user is treated as passive (cannot login, shown as expired). */
  accountExpiryDate?: string | null;
  /** For Manager (GenelKullanici): max workers this user can add. Set by Admin. */
  subUserLimit?: number | null;
  /** For Manager: number of workers added by this user (incremented/decremented on add/delete). */
  currentWorkerCount?: number;
  /** When true, user must change password on next login (e.g. auto-created from worker). */
  mustChangePassword?: boolean;
  /** Link to worker record when user was auto-created from a worker (İSG Uzmanı / İşyeri Hekimi). */
  associatedWorkerId?: string | null;
  /** Parent user id (e.g. Manager who created this user). Root users have no parentId. */
  parentId?: string | null;
}

export interface UserHierarchy {
  roots: User[];
  children: Record<string, User[]>;
}

/** Returns users grouped as roots (no parent) and children by parentId. */
export function getHierarchy(users: User[]): UserHierarchy {
  const roots = users.filter((u) => !u.parentId || u.parentId === '');
  const children: Record<string, User[]> = {};
  users.forEach((u) => {
    if (u.parentId) {
      if (!children[u.parentId]) children[u.parentId] = [];
      children[u.parentId].push(u);
    }
  });
  return { roots, children };
}

/** Default password for auto-created user accounts (worker-based). Force change on first login. */
export const DEFAULT_WORKER_USER_PASSWORD = 'ozartek123';

/** Returns true if the user is a Manager (Yönetici) role. */
export function isManagerRole(role: UserRole): boolean {
  return role === 'GenelKullanici' || role === 'DemoGenel';
}

/** Returns true if the Manager can add one more worker (under their subUserLimit). */
export function canManagerAddWorker(user: User | null): boolean {
  if (!user || !isManagerRole(user.role)) return true;
  const limit = user.subUserLimit ?? 0;
  const count = user.currentWorkerCount ?? 0;
  return count < limit;
}

/** Returns true if the user account is expired (passive). */
export function isUserExpired(user: User): boolean {
  if (!user.accountExpiryDate) return false;
  const expiry = new Date(user.accountExpiryDate);
  return !Number.isNaN(expiry.getTime()) && new Date() > expiry;
}

/** Error message shown when login is rejected due to expired account. */
export const ACCOUNT_EXPIRED_MESSAGE =
  'Hesabınızın kullanım süresi dolmuştur. Lütfen sistem yöneticisi ile iletişime geçiniz.';

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
  /** Create a user account for a worker (İSG Uzmanı / İşyeri Hekimi). No Admin required. parentId = Manager who added. */
  addUserForWorker: (workerId: string, email: string, nameSurname: string, jobTitle: string, parentId?: string | null) => User | null;
  updateUser: (id: string, data: Partial<Omit<User, 'id'>>) => boolean;
  deleteUser: (id: string) => boolean;
  getUserById: (id: string) => User | undefined;
  changePassword: (newPassword: string) => boolean;
  /** Set new password for a user (e.g. force change). Sets mustChangePassword = false. */
  updatePassword: (userId: string, newPassword: string) => boolean;
  /** Admin sets a new password for any user; sets mustChangePassword = true (e.g. forgot password). */
  adminUpdatePassword: (userId: string, newPassword: string) => boolean;
  /** Reset password for user linked to worker (Admin/Manager). Used for "Resend credentials". */
  resetCredentialsForWorkerUser: (workerId: string) => boolean;
  incrementManagerWorkerCount: () => boolean;
  decrementManagerWorkerCount: () => boolean;
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
        if (!user) return null;
        if (isUserExpired(user)) {
          throw new Error(ACCOUNT_EXPIRED_MESSAGE);
        }
        set({ currentUser: user });
        return user;
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
          password: DEFAULT_WORKER_USER_PASSWORD,
          mustChangePassword: true,
          accountExpiryDate: data.accountExpiryDate ?? null,
          subUserLimit: (data as Partial<User>).subUserLimit ?? null,
          currentWorkerCount: (data as Partial<User>).currentWorkerCount ?? 0,
          associatedWorkerId: (data as Partial<User>).associatedWorkerId ?? null,
          parentId: (data as Partial<User>).parentId ?? null,
        };
        set((s) => ({ users: [user, ...s.users] }));
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;
        sendWelcomeEmail({ name, email: user.email, password: user.password }).catch(() => {});
        return user;
      },

      addUserForWorker: (workerId, email, nameSurname, jobTitle, parentId) => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) return null;
        const existing = get().users.some((u) => u.email.toLowerCase() === normalizedEmail);
        if (existing) return null;
        const parts = (nameSurname ?? '').trim().split(/\s+/);
        const firstName = parts[0] ?? '';
        const lastName = parts.slice(1).join(' ') ?? '';
        const isHekim = jobTitle === 'İşyeri Hekimi' || jobTitle === 'ISYERI_HEKIMI';
        const role: UserRole = isHekim ? 'Hekim' : 'IsgUzman';
        const user: User = {
          id: generateUserId(),
          email: normalizedEmail,
          password: DEFAULT_WORKER_USER_PASSWORD,
          firstName,
          lastName,
          phone: '',
          role,
          accountExpiryDate: null,
          subUserLimit: null,
          currentWorkerCount: 0,
          mustChangePassword: true,
          associatedWorkerId: workerId,
          parentId: parentId ?? null,
        };
        set((s) => ({ users: [user, ...s.users] }));
        return user;
      },

      updateUser: (id, data) => {
        const current = get().currentUser;
        if (!current || current.role !== 'Admin') return false;
        const target = get().users.find((u) => u.id === id);
        if (!target) return false;
        const updated: User = {
          ...target,
          ...data,
          subUserLimit: data.subUserLimit !== undefined ? data.subUserLimit : target.subUserLimit,
          currentWorkerCount: data.currentWorkerCount !== undefined ? data.currentWorkerCount : target.currentWorkerCount,
          mustChangePassword: data.mustChangePassword !== undefined ? data.mustChangePassword : target.mustChangePassword,
          associatedWorkerId: data.associatedWorkerId !== undefined ? data.associatedWorkerId : target.associatedWorkerId,
          parentId: data.parentId !== undefined ? data.parentId : target.parentId,
        };
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? updated : u)),
          currentUser: s.currentUser?.id === id ? updated : s.currentUser,
        }));
        return true;
      },

      updatePassword: (userId, newPassword) => {
        const trimmed = newPassword?.trim();
        if (!trimmed) return false;
        const target = get().users.find((u) => u.id === userId);
        if (!target) return false;
        const updated: User = { ...target, password: trimmed, mustChangePassword: false };
        set((s) => ({
          users: s.users.map((u) => (u.id === userId ? updated : u)),
          currentUser: s.currentUser?.id === userId ? updated : s.currentUser,
        }));
        return true;
      },

      adminUpdatePassword: (userId, newPassword) => {
        const current = get().currentUser;
        if (!current || current.role !== 'Admin') return false;
        const trimmed = newPassword?.trim();
        if (!trimmed) return false;
        const target = get().users.find((u) => u.id === userId);
        if (!target) return false;
        const updated: User = { ...target, password: trimmed, mustChangePassword: true };
        set((s) => ({
          users: s.users.map((u) => (u.id === userId ? updated : u)),
          currentUser: s.currentUser?.id === userId ? updated : s.currentUser,
        }));
        return true;
      },

      /** Increment current user's currentWorkerCount (call after Manager adds a worker). */
      incrementManagerWorkerCount: () => {
        const current = get().currentUser;
        if (!current || !isManagerRole(current.role)) return false;
        const next = (current.currentWorkerCount ?? 0) + 1;
        const updated: User = { ...current, currentWorkerCount: next };
        set((s) => ({
          users: s.users.map((u) => (u.id === current.id ? updated : u)),
          currentUser: s.currentUser?.id === current.id ? updated : s.currentUser,
        }));
        return true;
      },

      /** Decrement current user's currentWorkerCount (call after Manager deletes a worker). */
      decrementManagerWorkerCount: () => {
        const current = get().currentUser;
        if (!current || !isManagerRole(current.role)) return false;
        const next = Math.max(0, (current.currentWorkerCount ?? 0) - 1);
        const updated: User = { ...current, currentWorkerCount: next };
        set((s) => ({
          users: s.users.map((u) => (u.id === current.id ? updated : u)),
          currentUser: s.currentUser?.id === current.id ? updated : s.currentUser,
        }));
        return true;
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
        return get().updatePassword(current.id, newPassword.trim());
      },

      resetCredentialsForWorkerUser: (workerId: string) => {
        const current = get().currentUser;
        if (!current || (current.role !== 'Admin' && !isManagerRole(current.role))) return false;
        const target = get().users.find((u) => u.associatedWorkerId === workerId);
        if (!target) return false;
        const updated: User = { ...target, password: DEFAULT_WORKER_USER_PASSWORD, mustChangePassword: true };
        set((s) => ({
          users: s.users.map((u) => (u.id === target.id ? updated : u)),
          currentUser: s.currentUser?.id === target.id ? updated : s.currentUser,
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
