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
  /** Selected company for multi-tenancy; null = All Companies */
  selectedCompanyId: string | null;
  setUser: (user: User | null) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  toggleSidebar: () => void;
  setLocale: (locale: Locale) => void;
  setSelectedCompanyId: (id: string | null) => void;
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
      selectedCompanyId: null,
      setUser: (user) => set({ user }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setLocale: (locale) => set({ locale: sanitizeLocale(locale) }),
      setSelectedCompanyId: (selectedCompanyId) => set({ selectedCompanyId }),
    }),
    {
      name: 'ohs-app',
      partialize: (s) => ({ locale: s.locale, selectedCompanyId: s.selectedCompanyId }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted && typeof persisted === 'object'
          ? {
              ...('locale' in persisted
                ? { locale: sanitizeLocale((persisted as { locale: unknown }).locale) }
                : {}),
              ...('selectedCompanyId' in persisted &&
              (typeof (persisted as { selectedCompanyId: unknown }).selectedCompanyId === 'string' ||
                (persisted as { selectedCompanyId: unknown }).selectedCompanyId === null)
                ? { selectedCompanyId: (persisted as { selectedCompanyId: string | null }).selectedCompanyId }
                : {}),
            }
          : {}),
      }),
    }
  )
);
