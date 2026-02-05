import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PolyclinicOutcome = 'WORK' | 'HOME' | 'HOSPITAL' | 'REST';

export interface PolyclinicVitals {
  systolicBp: number;
  diastolicBp: number;
  pulse: number;
  temperature: number;
  weight: number;
}

export interface PolyclinicRecord {
  id: string;
  protocolNumber: number;
  workerId: string;
  date: Date;
  complaint: string;
  vitals: PolyclinicVitals;
  diagnosis: string;
  treatment: string;
  outcome: PolyclinicOutcome;
}

function generateId(): string {
  return `poly-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toDate(d: Date | string): Date {
  if (d instanceof Date) return d;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

const defaultVitals: PolyclinicVitals = {
  systolicBp: 0,
  diastolicBp: 0,
  pulse: 0,
  temperature: 0,
  weight: 0,
};

interface PolyclinicState {
  records: PolyclinicRecord[];
  addRecord: (data: Omit<PolyclinicRecord, 'id' | 'protocolNumber'>) => PolyclinicRecord;
  updateRecord: (id: string, data: Partial<Omit<PolyclinicRecord, 'id' | 'protocolNumber'>>) => void;
  deleteRecord: (id: string) => void;
  getRecordById: (id: string) => PolyclinicRecord | undefined;
  getRecordsByDateRange: (start: Date, end: Date) => PolyclinicRecord[];
  getNextProtocolNumber: () => number;
}

export const usePolyclinicStore = create<PolyclinicState>()(
  persist(
    (set, get) => ({
      records: [],

      getNextProtocolNumber: () => {
        const records = get().records;
        if (records.length === 0) return 1;
        const max = Math.max(...records.map((r) => r.protocolNumber));
        return max + 1;
      },

      addRecord: (data) => {
        const nextProtocol = get().getNextProtocolNumber();
        const record: PolyclinicRecord = {
          ...data,
          id: generateId(),
          protocolNumber: nextProtocol,
          date: toDate(data.date),
          vitals: data.vitals ?? defaultVitals,
        };
        set((state) => ({ records: [record, ...state.records] }));
        return record;
      },

      updateRecord: (id, data) => {
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id
              ? {
                  ...r,
                  ...data,
                  date: data.date ? toDate(data.date) : r.date,
                  vitals: data.vitals ?? r.vitals,
                }
              : r
          ),
        }));
      },

      deleteRecord: (id) => {
        set((state) => ({ records: state.records.filter((r) => r.id !== id) }));
      },

      getRecordById: (id) => get().records.find((r) => r.id === id),

      getRecordsByDateRange: (start, end) => {
        const s = toDate(start).getTime();
        const e = toDate(end).getTime();
        return get().records.filter((r) => {
          const t = toDate(r.date).getTime();
          return t >= s && t <= e;
        });
      },
    }),
    {
      name: 'ohs-polyclinic',
      partialize: (state) => ({ records: state.records }),
    }
  )
);
