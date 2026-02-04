import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EmergencyPlanType = 'Fire' | 'Earthquake' | 'Flood' | 'Chemical' | 'General';

export type EmergencyPlanStatus = 'Active' | 'Draft' | 'Expired';

export interface EmergencyPlan {
  id: string;
  title: string;
  type: EmergencyPlanType;
  version: string;
  createdDate: string; // ISO date string
  validUntil: string;   // ISO date string
  status: EmergencyPlanStatus;
  fileName: string;
}

/** Returns true if today > validUntil. */
export function isExpired(plan: EmergencyPlan): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return plan.validUntil < today;
}

function generateId(): string {
  return `ep-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const MOCK_PLANS: EmergencyPlan[] = [
  {
    id: 'ep-1',
    title: 'Merkez Ofis Yangın Planı',
    type: 'Fire',
    version: 'v1.2',
    createdDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: 'Active',
    fileName: 'merkez-ofis-yangin-plani-v1.2.pdf',
  },
  {
    id: 'ep-2',
    title: 'Deprem Acil Müdahale Planı',
    type: 'Earthquake',
    version: 'v2.0',
    createdDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    validUntil: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: 'Expired',
    fileName: 'deprem-acil-mudahale-v2.pdf',
  },
  {
    id: 'ep-3',
    title: 'Kimyasal Sızıntı Prosedürü',
    type: 'Chemical',
    version: 'v0.9',
    createdDate: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: 'Draft',
    fileName: 'kimyasal-sizinti-taslak.pdf',
  },
];

interface EmergencyPlanState {
  plans: EmergencyPlan[];
  addPlan: (data: Omit<EmergencyPlan, 'id'>) => EmergencyPlan;
  updatePlanStatus: (id: string, status: EmergencyPlanStatus) => void;
  deletePlan: (id: string) => void;
  getPlanById: (id: string) => EmergencyPlan | undefined;
  loadData: (isDemo: boolean) => void;
}

export const useEmergencyPlanStore = create<EmergencyPlanState>()(
  persist(
    (set, get) => ({
      plans: MOCK_PLANS,

      addPlan: (data) => {
        const plan: EmergencyPlan = {
          ...data,
          id: generateId(),
        };
        set((state) => ({ plans: [plan, ...state.plans] }));
        return plan;
      },

      updatePlanStatus: (id, status) => {
        set((state) => ({
          plans: state.plans.map((p) => (p.id === id ? { ...p, status } : p)),
        }));
      },

      deletePlan: (id) => {
        set((state) => ({ plans: state.plans.filter((p) => p.id !== id) }));
      },

      getPlanById: (id) => get().plans.find((p) => p.id === id),

      loadData: (isDemo) => {
        if (isDemo) {
          set({ plans: [...MOCK_PLANS] });
        } else {
          set({ plans: [] });
        }
      },
    }),
    { name: 'ohs-emergency-plans', partialize: (s) => ({ plans: s.plans }) }
  )
);
