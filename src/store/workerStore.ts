import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkerFormValues } from '@domains/worker/schemas/workerSchema';
import { useAuthStore, DEFAULT_WORKER_USER_PASSWORD } from '@shared/stores/authStore';
import { useCompanyStore } from '@store/companyStore';
import { sendWelcomeEmail } from '@/services/emailService';

/** In this app the "user store" is authStore (useAuthStore). New users appear in Admin User Management and can log in. */

/** Job titles that trigger automatic user account creation (default password, force change on first login). */
export const AUTO_ACCOUNT_JOB_TITLES = ['İş Güvenliği Uzmanı', 'İşyeri Hekimi'] as const;

/** Job title codes that also trigger auto user + welcome email. */
const AUTO_ACCOUNT_JOB_CODES = ['ISG_UZMANI', 'ISYERI_HEKIMI'] as const;

function shouldAutoCreateUser(jobTitle: string | undefined): boolean {
  if (!jobTitle) return false;
  if (AUTO_ACCOUNT_JOB_TITLES.some((t) => t === jobTitle)) return true;
  if (AUTO_ACCOUNT_JOB_CODES.some((c) => c === jobTitle)) return true;
  return false;
}

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
  /** Resend login credentials email for a worker (Admin/Manager). Returns true if sent. */
  resendWorkerCredentials: (workerId: string) => boolean;
  loadData: (isDemo: boolean) => void;
}

export const useWorkerStore = create<WorkerState>()(
  persist(
    (set, get) => ({
      workers: [],

      addWorker: (data: WorkerFormValues) => {
        const worker: Worker = { ...data, id: generateId() };
        set((state) => ({ workers: [...state.workers, worker] }));

        const isAutoAccountJob =
          worker.jobTitle === 'ISG_UZMANI' || worker.jobTitle === 'ISYERI_HEKIMI' || shouldAutoCreateUser(worker.jobTitle);
        const hasEmailAndName = !!(worker.email?.trim() && worker.nameSurname?.trim());

        if (isAutoAccountJob && hasEmailAndName) {
          const authStore = useAuthStore.getState();
          const currentUserId = authStore.currentUser?.id ?? null;
          const newUser = authStore.addUserForWorker(
            worker.id,
            worker.email!.trim(),
            worker.nameSurname!.trim(),
            worker.jobTitle!,
            currentUserId
          );
          if (newUser) {
            const companyName = worker.companyId
              ? useCompanyStore.getState().getCompanyById(worker.companyId)?.name ?? ''
              : '';
            sendWelcomeEmail({
              name: worker.nameSurname.trim(),
              email: worker.email.trim(),
              password: DEFAULT_WORKER_USER_PASSWORD,
              company_name: companyName,
            }).catch((emailErr) => {
              console.error('[workerStore] Welcome email failed (e.g. ad blocker):', emailErr);
            });
          }
        }
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

      resendWorkerCredentials: (workerId: string) => {
        const worker = get().workers.find((w) => w.id === workerId);
        if (!worker?.email?.trim() || !worker?.nameSurname?.trim()) return false;
        const authStore = useAuthStore.getState();
        const ok = authStore.resetCredentialsForWorkerUser(workerId);
        if (!ok) return false;
        const companyName = worker.companyId
          ? useCompanyStore.getState().getCompanyById(worker.companyId)?.name ?? ''
          : '';
        sendWelcomeEmail({
          name: worker.nameSurname.trim(),
          email: worker.email.trim(),
          password: DEFAULT_WORKER_USER_PASSWORD,
          company_name: companyName,
        }).catch(() => {});
        return true;
      },

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
