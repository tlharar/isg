import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** İş Kazası / Ramak Kala */
export type IncidentType = 'İş Kazası' | 'Ramak Kala';

export type IncidentStatus = 'Açık' | 'Kapandı';

export interface Incident {
  id: string;
  type: IncidentType;
  employeeId: string;
  dateTime: string; // ISO string
  location: string; // Birim
  injuryType: string; // e.g. Kesik, Yanık, Kırık
  injuredBodyPart: string; // e.g. El, Ayak, Göz
  rootCause: string;
  status: IncidentStatus;
  createdAt: string;
}

function generateId(): string {
  return `inc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Kept outside store for reuse (e.g. loadData). */
const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'inc1',
    type: 'İş Kazası',
    employeeId: '1',
    dateTime: '2025-01-15T10:30:00.000Z',
    location: 'Üretim',
    injuryType: 'Kesik',
    injuredBodyPart: 'El',
    rootCause: 'Koruyucu eldiven kullanılmadı.',
    status: 'Kapandı',
    createdAt: '2025-01-15T10:35:00.000Z',
  },
  {
    id: 'inc2',
    type: 'Ramak Kala',
    employeeId: '2',
    dateTime: '2025-01-20T14:00:00.000Z',
    location: 'Depo',
    injuryType: '—',
    injuredBodyPart: '—',
    rootCause: 'Düşen malzeme, kişiye isabet etmedi.',
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
  loadData: (isDemo: boolean) => void;
}

export const useIncidentStore = create<IncidentState>()(
  persist(
    (set, get) => ({
      incidents: MOCK_INCIDENTS,

      addIncident: (data) => {
        const now = new Date().toISOString();
        const incident: Incident = {
          ...data,
          id: generateId(),
          createdAt: now,
        };
        set((state) => ({ incidents: [incident, ...state.incidents] }));
        return incident;
      },

      updateIncident: (id, data) => {
        set((state) => ({
          incidents: state.incidents.map((i) =>
            i.id === id ? { ...i, ...data } : i
          ),
        }));
      },

      deleteIncident: (id) => {
        set((state) => ({ incidents: state.incidents.filter((i) => i.id !== id) }));
      },

      getIncidentById: (id) => get().incidents.find((i) => i.id === id),

      getIncidentsByEmployee: (employeeId) =>
        get().incidents.filter((i) => i.employeeId === employeeId),

      loadData: (isDemo) => {
        if (isDemo) {
          set({ incidents: [...MOCK_INCIDENTS] });
        } else {
          set({ incidents: [] });
        }
      },
    }),
    { name: 'ohs-incidents', partialize: (s) => ({ incidents: s.incidents }) }
  )
);
