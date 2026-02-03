import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SelectionMethod = 'Seçim' | 'Atama';
export type RepresentativeStatus = 'Aktif' | 'Pasif';

export interface Representative {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  jobTitle?: string; // Cached for display (Görevi)
  selectionMethod: SelectionMethod;
  selectionDate: Date;
  validUntil: Date;
  status: RepresentativeStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** Compute status from validUntil date */
export function getRepresentativeStatus(validUntil: Date): RepresentativeStatus {
  return new Date() <= new Date(validUntil) ? 'Aktif' : 'Pasif';
}

/** Default: validUntil = selectionDate + 5 years */
function defaultValidUntil(selectionDate: Date): Date {
  const d = new Date(selectionDate);
  d.setFullYear(d.getFullYear() + 5);
  return d;
}

type AddRepresentativeInput = Omit<Representative, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { validUntil?: Date };

interface RepresentativeState {
  representatives: Representative[];
  addRepresentative: (data: AddRepresentativeInput) => void;
  updateRepresentative: (id: string, data: Partial<Omit<Representative, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteRepresentative: (id: string) => void;
  getRepresentativeById: (id: string) => Representative | undefined;
  fetchByCompany: (companyId: string) => Representative[];
}

function generateId(): string {
  return `rep-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const now = new Date();
const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
const fiveYearsLater = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate());
const threeYearsLater = new Date(now.getFullYear() + 3, now.getMonth(), now.getDate());

const MOCK_REPRESENTATIVES: Representative[] = [
  {
    id: 'rep-1',
    companyId: 'c1',
    employeeId: 'emp-1',
    employeeName: 'Ahmet Yılmaz',
    jobTitle: 'Kaynakçı',
    selectionMethod: 'Seçim',
    selectionDate: fiveYearsAgo,
    validUntil: now,
    status: 'Pasif',
    createdAt: fiveYearsAgo,
    updatedAt: now,
  },
  {
    id: 'rep-2',
    companyId: 'c1',
    employeeId: 'emp-2',
    employeeName: 'Ayşe Demir',
    jobTitle: 'Montaj Ustası',
    selectionMethod: 'Atama',
    selectionDate: new Date(now.getFullYear(), 0, 15),
    validUntil: fiveYearsLater,
    status: 'Aktif',
    createdAt: new Date(now.getFullYear(), 0, 15),
    updatedAt: now,
  },
  {
    id: 'rep-3',
    companyId: 'c2',
    employeeId: 'emp-3',
    employeeName: 'Mehmet Kaya',
    jobTitle: 'Kalite Kontrol',
    selectionMethod: 'Seçim',
    selectionDate: new Date(now.getFullYear() - 1, 3, 1),
    validUntil: threeYearsLater,
    status: 'Aktif',
    createdAt: new Date(now.getFullYear() - 1, 3, 1),
    updatedAt: now,
  },
];

export const useRepresentativeStore = create<RepresentativeState>()(
  persist(
    (set, get) => ({
      representatives: MOCK_REPRESENTATIVES,

      addRepresentative: (data) => {
        const now_ = new Date();
        const validUntil = data.validUntil ?? defaultValidUntil(data.selectionDate);
        const status = getRepresentativeStatus(validUntil);
        const newItem: Representative = {
          ...data,
          validUntil,
          status,
          id: generateId(),
          createdAt: now_,
          updatedAt: now_,
        };
        set((state) => ({ representatives: [...state.representatives, newItem] }));
      },

      updateRepresentative: (id, updates) => {
        set((state) => {
          const rep = state.representatives.find((r) => r.id === id);
          if (!rep) return state;
          const merged = { ...rep, ...updates };
          if (updates.validUntil !== undefined) {
            merged.status = getRepresentativeStatus(updates.validUntil);
          }
          merged.updatedAt = new Date();
          return {
            representatives: state.representatives.map((r) => (r.id === id ? merged : r)),
          };
        });
      },

      deleteRepresentative: (id) => {
        set((state) => ({ representatives: state.representatives.filter((r) => r.id !== id) }));
      },

      getRepresentativeById: (id) => get().representatives.find((r) => r.id === id),

      fetchByCompany: (companyId) => {
        return get().representatives.filter((r) => r.companyId === companyId);
      },
    }),
    { name: 'ohs-representative-store' }
  )
);
