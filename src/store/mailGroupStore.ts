import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MailGroup {
  id: string;
  companyId: string;
  name: string;
  emails: string[];
  description?: string;
}

interface MailGroupState {
  mailGroups: MailGroup[];
  addGroup: (data: Omit<MailGroup, 'id'>) => void;
  updateGroup: (id: string, data: Partial<Omit<MailGroup, 'id'>>) => void;
  deleteGroup: (id: string) => void;
  getGroupById: (id: string) => MailGroup | undefined;
  fetchByCompany: (companyId: string) => MailGroup[];
}

function generateId(): string {
  return `mg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const MOCK_MAIL_GROUPS: MailGroup[] = [
  {
    id: 'mg-1',
    companyId: 'c1',
    name: 'Yönetim Kurulu',
    emails: ['yonetim@firma.com', 'genel.mudur@firma.com', 'isg.sorumlusu@firma.com'],
    description: 'Kaza raporları ve aylık özet bildirimleri için dağıtım listesi.',
  },
  {
    id: 'mg-2',
    companyId: 'c1',
    name: 'Acil Müdahale Ekibi',
    emails: ['acil@firma.com', 'guvenlik@firma.com', 'saglik@firma.com', 'ustabasi@firma.com'],
    description: 'Acil durum ve kaza bildirimleri.',
  },
];

export const useMailGroupStore = create<MailGroupState>()(
  persist(
    (set, get) => ({
      mailGroups: MOCK_MAIL_GROUPS,

      addGroup: (data) => {
        const newGroup: MailGroup = {
          ...data,
          id: generateId(),
        };
        set((state) => ({ mailGroups: [...state.mailGroups, newGroup] }));
      },

      updateGroup: (id, updates) => {
        set((state) => {
          const group = state.mailGroups.find((g) => g.id === id);
          if (!group) return state;
          const merged = { ...group, ...updates };
          return {
            mailGroups: state.mailGroups.map((g) => (g.id === id ? merged : g)),
          };
        });
      },

      deleteGroup: (id) => {
        set((state) => ({
          mailGroups: state.mailGroups.filter((g) => g.id !== id),
        }));
      },

      getGroupById: (id) => get().mailGroups.find((g) => g.id === id),

      fetchByCompany: (companyId) => {
        return get().mailGroups.filter((g) => g.companyId === companyId);
      },
    }),
    { name: 'ohs-mail-group-store' }
  )
);
