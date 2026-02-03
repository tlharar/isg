import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type IncidentType = 'İş Kazası' | 'Ramak Kala';
export type IncidentSeverity = 'Hafif' | 'Orta' | 'Ağır';
export type IncidentStatus = 'Açık' | 'Kapandı';

export interface Incident {
  id: string;
  type: IncidentType;
  employeeId: string;
  date: string; // ISO date
  location: string; // Birim
  description: string;
  injuryType: string; // e.g. Kesik, Yanık, Kırık
  bodyPart: string; // e.g. El, Göz
  severity: IncidentSeverity;
  status: IncidentStatus;
  createdAt: string;
}

function generateId(): string {
  return `inc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const INITIAL: Incident[] = [
  {
    id: 'inc1',
    type: 'İş Kazası',
    employeeId: '1',
    date: '2025-01-15',
    location: 'Üretim',
    description: 'Koruyucu eldiven kullanılmadı.',
    injuryType: 'Kesik',
    bodyPart: 'El',
    severity: 'Orta',
    status: 'Kapandı',
    createdAt: '2025-01-15T10:35:00.000Z',
  },
  {
    id: 'inc2',
    type: 'Ramak Kala',
    employeeId: '2',
    date: '2025-01-20',
    location: 'Depo',
    description: 'Düşen malzeme, kişiye isabet etmedi.',
    injuryType: '—',
    bodyPart: '—',
    severity: 'Hafif',
    status: 'Açık',
    createdAt: '2025-01-20T14:05:00.000Z',
  },
];

interface IncidentState {
  incidents: Incident[];
  addIncident: (data: Omit<Incident, 'id' | 'createdAt'>) => Incident;
  updateIncident: (id: string, data: Partial<Omit<Incident, 'id' | 'createdAt'>>) => void;
  deleteIncident: (id: string) => void;
  getIncidentById: (id: string) => Incident | undefined;
  getIncidentsByEmployee: (employeeId: string) => Incident[];
}

export const useIncidentStore = create<IncidentState>()(
  persist(
    (set, get) => ({
      incidents: INITIAL,

      addIncident: (data) => {
        const now = new Date().toISOString();
        const incident: Incident = { ...data, id: generateId(), createdAt: now };
        set((state) => ({ incidents: [incident, ...state.incidents] }));
        return incident;
      },

      updateIncident: (id, data) => {
        set((state) => ({
          incidents: state.incidents.map((i) => (i.id === id ? { ...i, ...data } : i)),
        }));
      },

      deleteIncident: (id) => {
        set((state) => ({ incidents: state.incidents.filter((i) => i.id !== id) }));
      },

      getIncidentById: (id) => get().incidents.find((i) => i.id === id),
      getIncidentsByEmployee: (employeeId) => get().incidents.filter((i) => i.employeeId === employeeId),
    }),
    { name: 'ohs-incidents', partialize: (s) => ({ incidents: s.incidents }) }
  )
);
