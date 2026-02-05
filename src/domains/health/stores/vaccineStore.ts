import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VaccineType = 'TETANUS' | 'HEPATITIS_B' | 'INFLUENZA' | 'COVID19' | 'OTHER';

export type VaccineStatus = 'PENDING' | 'COMPLETED' | 'REFUSED';

export interface VaccineRecord {
  id: string;
  workerId: string;
  vaccineType: VaccineType;
  doseNumber: number;
  isBooster: boolean;
  applicationDate: Date;
  nextDoseDate: Date | null;
  status: VaccineStatus;
  batchNumber: string;
  administeredBy: string;
  location: string;
  notes: string;
}

function generateId(): string {
  return `vax-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toDate(d: Date | string): Date {
  if (d instanceof Date) return d;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

interface VaccineState {
  records: VaccineRecord[];
  addVaccine: (data: Omit<VaccineRecord, 'id'>) => VaccineRecord;
  updateVaccine: (id: string, data: Partial<Omit<VaccineRecord, 'id'>>) => void;
  deleteVaccine: (id: string) => void;
  getVaccineById: (id: string) => VaccineRecord | undefined;
  getVaccinesByWorker: (workerId: string) => VaccineRecord[];
}

export const useVaccineStore = create<VaccineState>()(
  persist(
    (set, get) => ({
      records: [],

      addVaccine: (data) => {
        const record: VaccineRecord = {
          ...data,
          id: generateId(),
          applicationDate: toDate(data.applicationDate),
          nextDoseDate: data.nextDoseDate ? toDate(data.nextDoseDate) : null,
        };
        set((state) => ({ records: [record, ...state.records] }));
        return record;
      },

      updateVaccine: (id, data) => {
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id
              ? {
                  ...r,
                  ...data,
                  applicationDate: data.applicationDate ? toDate(data.applicationDate) : r.applicationDate,
                  nextDoseDate: data.nextDoseDate !== undefined
                    ? (data.nextDoseDate ? toDate(data.nextDoseDate) : null)
                    : r.nextDoseDate,
                }
              : r
          ),
        }));
      },

      deleteVaccine: (id) => {
        set((state) => ({ records: state.records.filter((r) => r.id !== id) }));
      },

      getVaccineById: (id) => get().records.find((r) => r.id === id),

      getVaccinesByWorker: (workerId) =>
        get().records
          .filter((r) => r.workerId === workerId)
          .sort((a, b) => toDate(b.applicationDate).getTime() - toDate(a.applicationDate).getTime()),
    }),
    {
      name: 'ohs-vaccine',
      partialize: (s) => ({ records: s.records }),
    }
  )
);

/** Suggested next dose date by vaccine type and current dose (standard protocols). */
export function getSuggestedNextDoseDate(
  vaccineType: VaccineType,
  doseNumber: number,
  applicationDate: Date
): Date | null {
  const d = new Date(applicationDate);
  if (Number.isNaN(d.getTime())) return null;
  const addMonths = (n: number) => {
    const next = new Date(d);
    next.setMonth(next.getMonth() + n);
    return next;
  };
  const addYears = (n: number) => {
    const next = new Date(d);
    next.setFullYear(next.getFullYear() + n);
    return next;
  };
  switch (vaccineType) {
    case 'TETANUS':
      if (doseNumber === 1) return addMonths(1);
      if (doseNumber === 2) return addMonths(6);
      return null;
    case 'HEPATITIS_B':
      if (doseNumber === 1) return addMonths(1);
      if (doseNumber === 2) return addMonths(5);
      return null;
    case 'COVID19':
      if (doseNumber === 1) return addMonths(1);
      return null;
    case 'INFLUENZA':
      return addYears(1);
    default:
      return null;
  }
}
