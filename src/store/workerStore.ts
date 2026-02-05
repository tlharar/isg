import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkerFormValues } from '@domains/worker/schemas/workerSchema';

/** For 'Yetkilendirme' e.g. 'Usta Başı', 'Çalışan Temsilcisi' */
export type WorkerRoleCode = 'Usta Basi' | 'Calisan Temsilcisi' | 'Acil Durum Eki';

/** For 'Aktif Vize' (visa status) */
export interface WorkerVisaStatus {
  code: string;
  expiry: Date | string;
}

export interface Worker extends WorkerFormValues {
  id: string;
  /** For Yetkilendirme */
  roles?: string[];
  /** For Aktif Vize Sorgulama */
  visaStatus?: WorkerVisaStatus;
  /** History of companies this worker is/was assigned to */
  assignedCompanyIds?: string[];
}

/** Kept outside store for reuse (e.g. loadData). */
const MOCK_WORKERS: Worker[] = [
  { id: '1', nameSurname: 'Ahmet Yılmaz', idNumber: '12345678901', email: 'ahmet@example.com', jobTitle: 'Technician', companyId: 'c1' },
  { id: '2', nameSurname: 'Ayşe Demir', idNumber: '98765432109', email: 'ayse@example.com', jobTitle: 'Engineer', companyId: 'c2' },
];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface WorkerState {
  workers: Worker[];
  addWorker: (data: WorkerFormValues) => Worker;
  updateWorker: (id: string, data: Partial<Omit<Worker, 'id'>>) => void;
  deleteWorker: (id: string) => void;
  getWorkerById: (id: string) => Worker | undefined;
  loadData: (isDemo: boolean) => void;
}

export const useWorkerStore = create<WorkerState>()(
  persist(
    (set, get) => ({
      workers: [],

      addWorker: (data: WorkerFormValues) => {
        const worker: Worker = { ...data, id: generateId() };
        set((state) => ({ workers: [...state.workers, worker] }));
        return worker;
      },

      updateWorker: (id: string, data: Partial<Omit<Worker, 'id'>>) => {
        set((state) => ({
          workers: state.workers.map((w) =>
            w.id === id
              ? {
                  ...w,
                  ...data,
                  id: w.id,
                  companyId: data.companyId ?? w.companyId,
                  subContractorId: data.subContractorId ?? w.subContractorId,
                  roles: data.roles !== undefined ? data.roles : w.roles,
                  visaStatus: data.visaStatus !== undefined ? data.visaStatus : w.visaStatus,
                  assignedCompanyIds: data.assignedCompanyIds !== undefined ? data.assignedCompanyIds : w.assignedCompanyIds,
                }
              : w
          ),
        }));
      },

      deleteWorker: (id: string) => {
        set((state) => ({ workers: state.workers.filter((w) => w.id !== id) }));
      },

      getWorkerById: (id: string) => get().workers.find((w) => w.id === id),

      loadData: (isDemo) => {
        if (isDemo) {
          set({ workers: [...MOCK_WORKERS] });
        } else {
          set({ workers: [] });
        }
      },
    }),
    {
      name: 'ohs-workers',
      partialize: (state) => ({ workers: state.workers }),
    }
  )
);
