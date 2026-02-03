import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OsgbStatus = 'Aktif' | 'Pasif' | 'İptal' | 'Aday';

export interface OsgbLead {
  id: string;
  name: string; // Yetki Belgesi Unvanı
  licenseNumber: string; // Yetki Belgesi No
  licenseType: string; // Yetki Belgesi Tipi
  city: string; // Yetki Belgesi İli
  district: string; // Yetki Belgesi İlçe
  address: string; // Yetki Belgesi Adresi
  phone: string; // Telefon
  email: string; // E-posta
  status: OsgbStatus; // Durum
  createdAt: Date;
  updatedAt: Date;
}

interface OsgbState {
  leads: OsgbLead[];
  addLead: (lead: Omit<OsgbLead, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addLeadsBulk: (leads: Omit<OsgbLead, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  replaceAllLeads: (leads: Omit<OsgbLead, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  updateLead: (id: string, lead: Partial<Omit<OsgbLead, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteLead: (id: string) => void;
  deleteAllLeads: () => void;
  getLeadById: (id: string) => OsgbLead | undefined;
  getUniqueCities: () => string[];
}

function generateId(): string {
  return `osgb-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useOsgbStore = create<OsgbState>()(
  persist(
    (set, get) => ({
      leads: [],
      addLead: (lead) => {
        const now = new Date();
        const newLead: OsgbLead = {
          ...lead,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ leads: [...state.leads, newLead] }));
      },
      addLeadsBulk: (leadsData) => {
        const now = new Date();
        const newLeads: OsgbLead[] = leadsData.map((data) => ({
          ...data,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        }));
        set((state) => ({ leads: [...state.leads, ...newLeads] }));
      },
      replaceAllLeads: (leadsData) => {
        const now = new Date();
        const newLeads: OsgbLead[] = leadsData.map((data) => ({
          ...data,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        }));
        set({ leads: newLeads });
      },
      updateLead: (id, updates) => {
        set((state) => ({
          leads: state.leads.map((lead) =>
            lead.id === id ? { ...lead, ...updates, updatedAt: new Date() } : lead
          ),
        }));
      },
      deleteLead: (id) => {
        set((state) => ({ leads: state.leads.filter((lead) => lead.id !== id) }));
      },
      deleteAllLeads: () => {
        set({ leads: [] });
      },
      getLeadById: (id) => get().leads.find((lead) => lead.id === id),
      getUniqueCities: () => {
        const cities = get().leads.map((lead) => lead.city).filter(Boolean);
        return [...new Set(cities)].sort((a, b) => a.localeCompare(b, 'tr'));
      },
    }),
    {
      name: 'ohs-osgb-store',
    }
  )
);
