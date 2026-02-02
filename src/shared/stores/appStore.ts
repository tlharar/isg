import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '@shared/i18n/translations';

export interface User {
  id: string;
  displayName: string;
  email: string;
  role: string;
}

interface AppState {
  user: User | null;
  theme: 'light' | 'dark' | 'auto';
  sidebarCollapsed: boolean;
  locale: Locale;
  setUser: (user: User | null) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  toggleSidebar: () => void;
  setLocale: (locale: Locale) => void;
}

function sanitizeLocale(locale: unknown): Locale {
  return locale === 'en' ? 'en' : 'tr';
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: {
        id: '1',
        displayName: 'Demo User',
        email: 'demo@ohs.local',
        role: 'admin',
      },
      theme: 'light',
      sidebarCollapsed: false,
      locale: 'tr',
      setUser: (user) => set({ user }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setLocale: (locale) => set({ locale: sanitizeLocale(locale) }),
    }),
    {
      name: 'ohs-app',
      partialize: (s) => ({ locale: s.locale }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted && typeof persisted === 'object' && 'locale' in persisted
          ? { locale: sanitizeLocale((persisted as { locale: unknown }).locale) }
          : {}),
      }),
    }
  )
);
