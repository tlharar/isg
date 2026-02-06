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
  /** Selected main (parent) company; drives the main dropdown */
  selectedMainCompanyId: string | null;
  /** Selected sub-contractor under the main company; null = viewing main company */
  selectedSubCompanyId: string | null;
  /** Effective company for multi-tenancy: sub if set, else main. Use this for filtering data. */
  selectedCompanyId: string | null;
  setUser: (user: User | null) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  toggleSidebar: () => void;
  setLocale: (locale: Locale) => void;
  setSelectedCompanyId: (id: string | null) => void;
  setSelectedMainCompany: (id: string | null) => void;
  setSelectedSubCompany: (id: string | null) => void;
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
      selectedMainCompanyId: null,
      selectedSubCompanyId: null,
      selectedCompanyId: null,
      setUser: (user) => set({ user }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setLocale: (locale) => set({ locale: sanitizeLocale(locale) }),
      setSelectedCompanyId: (id) =>
        set({ selectedMainCompanyId: id, selectedSubCompanyId: null, selectedCompanyId: id }),
      setSelectedMainCompany: (id) =>
        set({ selectedMainCompanyId: id, selectedSubCompanyId: null, selectedCompanyId: id }),
      setSelectedSubCompany: (id) =>
        set((s) => ({
          selectedSubCompanyId: id,
          selectedCompanyId: id ?? s.selectedMainCompanyId,
        })),
    }),
    {
      name: 'ohs-app',
      partialize: (s) => ({
        locale: s.locale,
        selectedCompanyId: s.selectedCompanyId,
        selectedMainCompanyId: s.selectedMainCompanyId,
        selectedSubCompanyId: s.selectedSubCompanyId,
      }),
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== 'object') return current;
        const p = persisted as Record<string, unknown>;
        const out = { ...current };
        if ('locale' in p) out.locale = sanitizeLocale(p.locale as Locale);
        const hasLegacy =
          'selectedCompanyId' in p &&
          (typeof p.selectedCompanyId === 'string' || p.selectedCompanyId === null);
        const hasMain =
          'selectedMainCompanyId' in p &&
          (typeof p.selectedMainCompanyId === 'string' || p.selectedMainCompanyId === null);
        const hasSub =
          'selectedSubCompanyId' in p &&
          (typeof p.selectedSubCompanyId === 'string' || p.selectedSubCompanyId === null);
        out.selectedMainCompanyId = hasMain
          ? (p.selectedMainCompanyId as string | null)
          : hasLegacy
            ? (p.selectedCompanyId as string | null)
            : null;
        out.selectedSubCompanyId = hasSub ? (p.selectedSubCompanyId as string | null) : null;
        out.selectedCompanyId =
          out.selectedSubCompanyId ?? out.selectedMainCompanyId ?? null;
        return out;
      },
    }
  )
);
