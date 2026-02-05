import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Lead pipeline status */
export type CRMStatus =
  | 'NEW'           // Yeni - Default
  | 'CONTACTED'     // Görüşüldü/Ulaşıldı
  | 'DEMO_DEFINED'  // Demo Tanımlandı
  | 'OFFER_SENT'    // Teklif Gönderildi
  | 'WON'           // Satış/Aktif Müşteri - Green
  | 'LOST';         // Reddedildi/Olumsuz - Red

export interface CRMNote {
  id: string;
  date: Date;
  content: string;
  createdBy: string;
}

export interface CRMLead {
  id: string;
  name: string;
  licenseNumber: string;
  licenseType: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  email: string;
  status: CRMStatus;
  notes: CRMNote[];
  createdAt: Date;
  updatedAt: Date;
}

export type CRMLeadInput = Omit<CRMLead, 'id' | 'createdAt' | 'updatedAt' | 'notes'> & {
  notes?: CRMNote[];
};

function generateId(): string {
  return `crm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function noteId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toDate(d: Date | string): Date {
  if (d instanceof Date) return d;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

interface CRMState {
  leads: CRMLead[];
  addLead: (lead: Omit<CRMLead, 'id' | 'createdAt' | 'updatedAt'>) => CRMLead;
  addLeadsBulk: (leads: Omit<CRMLead, 'id' | 'createdAt' | 'updatedAt' | 'notes'>[]) => void;
  replaceAllLeads: (leads: Omit<CRMLead, 'id' | 'createdAt' | 'updatedAt' | 'notes'>[]) => void;
  updateLead: (id: string, data: Partial<Omit<CRMLead, 'id'>>) => void;
  updateLeadStatus: (id: string, status: CRMStatus) => void;
  addLeadNote: (id: string, noteContent: string, createdBy: string) => void;
  deleteLead: (id: string) => void;
  deleteAllLeads: () => void;
  getLeadById: (id: string) => CRMLead | undefined;
  getUniqueCities: () => string[];
}

export const useCrmStore = create<CRMState>()(
  persist(
    (set, get) => ({
      leads: [],

      addLead: (lead) => {
        const now = new Date();
        const newLead: CRMLead = {
          ...lead,
          id: generateId(),
          notes: lead.notes ?? [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ leads: [...state.leads, newLead] }));
        return newLead;
      },

      addLeadsBulk: (leadsData) => {
        const now = new Date();
        const newLeads: CRMLead[] = leadsData.map((data) => ({
          ...data,
          id: generateId(),
          status: (data.status as CRMStatus) ?? 'NEW',
          notes: [],
          createdAt: now,
          updatedAt: now,
        }));
        set((state) => ({ leads: [...state.leads, ...newLeads] }));
      },

      replaceAllLeads: (leadsData) => {
        const now = new Date();
        const newLeads: CRMLead[] = leadsData.map((data) => ({
          ...data,
          id: generateId(),
          status: (data.status as CRMStatus) ?? 'NEW',
          notes: [],
          createdAt: now,
          updatedAt: now,
        }));
        set({ leads: newLeads });
      },

      updateLead: (id, updates) => {
        set((state) => ({
          leads: state.leads.map((lead) =>
            lead.id === id
              ? {
                  ...lead,
                  ...updates,
                  notes: updates.notes ?? lead.notes,
                  updatedAt: new Date(),
                }
              : lead
          ),
        }));
      },

      updateLeadStatus: (id, status) => {
        set((state) => ({
          leads: state.leads.map((lead) =>
            lead.id === id ? { ...lead, status, updatedAt: new Date() } : lead
          ),
        }));
      },

      addLeadNote: (id, noteContent, createdBy) => {
        const note: CRMNote = {
          id: noteId(),
          date: new Date(),
          content: noteContent.trim(),
          createdBy,
        };
        set((state) => ({
          leads: state.leads.map((lead) =>
            lead.id === id
              ? {
                  ...lead,
                  notes: [note, ...lead.notes],
                  updatedAt: new Date(),
                }
              : lead
          ),
        }));
      },

      deleteLead: (id) => {
        set((state) => ({ leads: state.leads.filter((l) => l.id !== id) }));
      },

      deleteAllLeads: () => set({ leads: [] }),

      getLeadById: (id) => get().leads.find((l) => l.id === id),

      getUniqueCities: () => {
        const cities = get().leads.map((l) => l.city).filter(Boolean);
        return [...new Set(cities)].sort((a, b) => a.localeCompare(b, 'tr'));
      },
    }),
    {
      name: 'ohs-crm-store',
      partialize: (s) => ({ leads: s.leads }),
    }
  )
);
