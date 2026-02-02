import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkerFormValues } from '@domains/worker/schemas/workerSchema';

export interface Worker extends WorkerFormValues {
  id: string;
}

const INITIAL_WORKERS: Worker[] = [
  { id: '1', nameSurname: 'Ahmet Yılmaz', idNumber: '12345678901', email: 'ahmet@example.com', jobTitle: 'Technician', companyId: 'c1' },
  { id: '2', nameSurname: 'Ayşe Demir', idNumber: '98765432109', email: 'ayse@example.com', jobTitle: 'Engineer', companyId: 'c2' },
];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface WorkerState {
  workers: Worker[];
  addWorker: (data: WorkerFormValues) => Worker;
  updateWorker: (id: string, data: WorkerFormValues) => void;
  deleteWorker: (id: string) => void;
  getWorkerById: (id: string) => Worker | undefined;
}

export const useWorkerStore = create<WorkerState>()(
  persist(
    (set, get) => ({
      workers: INITIAL_WORKERS,

      addWorker: (data: WorkerFormValues) => {
        const worker: Worker = { ...data, id: generateId() };
        set((state) => ({ workers: [...state.workers, worker] }));
        return worker;
      },

      updateWorker: (id: string, data: WorkerFormValues) => {
        set((state) => ({
          workers: state.workers.map((w) =>
            w.id === id ? { ...data, id: w.id, companyId: data.companyId ?? w.companyId } : w
          ),
        }));
      },

      deleteWorker: (id: string) => {
        set((state) => ({ workers: state.workers.filter((w) => w.id !== id) }));
      },

      getWorkerById: (id: string) => get().workers.find((w) => w.id === id),
    }),
    {
      name: 'ohs-workers',
      partialize: (state) => ({ workers: state.workers }),
    }
  )
);
