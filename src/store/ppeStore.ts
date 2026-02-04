import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** KKD (Kişisel Koruyucu Donanım) / PPE custody record */
export interface PpeRecord {
  id: string;
  employeeId: string;
  equipment: string; // e.g. Baret, Eldiven
  dateGiven: string; // ISO date
  nextRenewalDate: string; // ISO date
  createdAt: string;
}

function generateId(): string {
  return `ppe-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Kept outside store for reuse (e.g. loadData). */
const MOCK_PPE: PpeRecord[] = [
  { id: 'ppe1', employeeId: '1', equipment: 'Baret', dateGiven: '2025-01-01', nextRenewalDate: '2026-01-01', createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'ppe2', employeeId: '1', equipment: 'Eldiven', dateGiven: '2025-01-01', nextRenewalDate: '2025-07-01', createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'ppe3', employeeId: '2', equipment: 'Baret', dateGiven: '2025-01-15', nextRenewalDate: '2026-01-15', createdAt: '2025-01-15T00:00:00.000Z' },
];

interface PpeState {
  records: PpeRecord[];
  addRecord: (data: Omit<PpeRecord, 'id' | 'createdAt'>) => PpeRecord;
  updateRecord: (id: string, data: Partial<Omit<PpeRecord, 'id' | 'createdAt'>>) => void;
  deleteRecord: (id: string) => void;
  getRecordsByEmployee: (employeeId: string) => PpeRecord[];
  loadData: (isDemo: boolean) => void;
}

export const usePpeStore = create<PpeState>()(
  persist(
    (set, get) => ({
      records: [],

      addRecord: (data) => {
        const now = new Date().toISOString();
        const record: PpeRecord = {
          ...data,
          id: generateId(),
          createdAt: now,
        };
        set((state) => ({ records: [record, ...state.records] }));
        return record;
      },

      updateRecord: (id, data) => {
        set((state) => ({
          records: state.records.map((r) => (r.id === id ? { ...r, ...data } : r)),
        }));
      },

      deleteRecord: (id) => {
        set((state) => ({ records: state.records.filter((r) => r.id !== id) }));
      },

      getRecordsByEmployee: (employeeId) =>
        get().records.filter((r) => r.employeeId === employeeId),

      loadData: (isDemo) => {
        if (isDemo) set({ records: [...MOCK_PPE] });
        else set({ records: [] });
      },
    }),
    { name: 'ohs-ppe', partialize: (s) => ({ records: s.records }) }
  )
);
