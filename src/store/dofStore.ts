import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DofSource =
  | 'Risk Analizi'
  | 'Saha Denetimi'
  | 'İş Kazası'
  | 'Çalışan Önerisi'
  | 'Kurul Kararı'
  | (string & {}); // allows e.g. 'Uygunsuzluk - ...' from non-conformity conversion

export type DofType = 'Düzenleyici' | 'Önleyici';

export type DofStatus = 'Açık' | 'Kapandı' | 'İptal';

export interface DofRecord {
  id: string;
  companyId: string;
  source: DofSource;
  type: DofType;
  description: string;
  responsible: string;
  deadline: string; // ISO date YYYY-MM-DD
  status: DofStatus;
  resultDescription?: string;
  closingDate?: string; // ISO date YYYY-MM-DD
}

/** Returns true if status is 'Açık' AND current date > deadline. */
export function isOverdue(record: DofRecord): boolean {
  if (record.status !== 'Açık') return false;
  const today = new Date().toISOString().slice(0, 10);
  return record.deadline < today;
}

function generateId(): string {
  return `dof-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface DofState {
  records: DofRecord[];
  addDof: (data: Omit<DofRecord, 'id'>) => DofRecord;
  updateDof: (id: string, data: Partial<Omit<DofRecord, 'id'>>) => void;
  closeDof: (id: string, resultDescription: string, closingDate: string) => void;
  deleteDof: (id: string) => void;
  getDofById: (id: string) => DofRecord | undefined;
  loadData: (isDemo: boolean) => void;
}

export const useDofStore = create<DofState>()(
  persist(
    (set, get) => ({
      records: [],

      addDof: (data) => {
        const record: DofRecord = {
          ...data,
          id: generateId(),
        };
        set((state) => ({ records: [record, ...state.records] }));
        return record;
      },

      updateDof: (id, data) => {
        set((state) => ({
          records: state.records.map((r) => (r.id === id ? { ...r, ...data } : r)),
        }));
      },

      closeDof: (id, resultDescription, closingDate) => {
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id
              ? { ...r, status: 'Kapandı' as const, resultDescription, closingDate }
              : r
          ),
        }));
      },

      deleteDof: (id) => {
        set((state) => ({ records: state.records.filter((r) => r.id !== id) }));
      },

      getDofById: (id) => get().records.find((r) => r.id === id),

      loadData: (isDemo) => {
        set({ records: [] });
      },
    }),
    { name: 'ohs-dof', partialize: (s) => ({ records: s.records }) }
  )
);
