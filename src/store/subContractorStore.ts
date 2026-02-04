import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SubContractorStatus = 'Active' | 'Passive';

export interface SubContractor {
  id: string;
  mainCompanyId: string;
  name: string;
  sgkNumber: string;
  /** Vergi No */
  taxNumber: string;
  /** Vergi Dairesi */
  taxOffice: string;
  /** Firma Yetkilisi */
  authorizedPerson: string;
  /** İletişim Telefonu */
  phone: string;
  /** İletişim E-Postası */
  email: string;
  contractStartDate: Date;
  contractEndDate: Date;
  /** Yapılan İş */
  workDescription: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Compute status from contract end date */
export function getSubContractorStatus(contractEndDate: Date): SubContractorStatus {
  return new Date() > new Date(contractEndDate) ? 'Passive' : 'Active';
}

const now = new Date();
const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
const nextMonth = new Date(now.getFullYear(), now.getMonth() + 2, now.getDate());

/** Kept outside store for reuse (e.g. loadData). */
export const MOCK_SUBCONTRACTORS: SubContractor[] = [
  {
    id: 'sub-1',
    mainCompanyId: 'c1',
    name: 'Yemekhane A.Ş.',
    sgkNumber: 'SGK-101',
    taxNumber: '1234567890',
    taxOffice: 'Kadıköy',
    authorizedPerson: 'Ahmet Yılmaz',
    phone: '+90 216 123 45 67',
    email: 'info@yemekhane.com',
    contractStartDate: lastYear,
    contractEndDate: nextYear,
    workDescription: 'Personel yemek hizmeti, kantin işletmesi',
    createdAt: lastYear,
    updatedAt: now,
  },
  {
    id: 'sub-2',
    mainCompanyId: 'c1',
    name: 'Güvenlik Ltd. Şti.',
    sgkNumber: 'SGK-102',
    taxNumber: '',
    taxOffice: '',
    authorizedPerson: '',
    phone: '',
    email: '',
    contractStartDate: new Date(now.getFullYear(), 0, 1),
    contractEndDate: nextYear,
    workDescription: 'Tesis güvenlik ve giriş-çıkış kontrolü',
    createdAt: new Date(now.getFullYear(), 0, 1),
    updatedAt: now,
  },
  {
    id: 'sub-3',
    mainCompanyId: 'c1',
    name: 'Temizlik Hizmetleri A.Ş.',
    sgkNumber: 'SGK-103',
    taxNumber: '',
    taxOffice: '',
    authorizedPerson: '',
    phone: '',
    email: '',
    contractStartDate: new Date(now.getFullYear() - 2, 5, 1),
    contractEndDate: new Date(now.getFullYear(), 4, 31),
    workDescription: 'Ofis ve üretim alanı temizlik hizmeti',
    createdAt: new Date(now.getFullYear() - 2, 5, 1),
    updatedAt: now,
  },
  {
    id: 'sub-4',
    mainCompanyId: 'c2',
    name: 'İnşaat Taahhüt Ltd.',
    sgkNumber: 'SGK-201',
    taxNumber: '',
    taxOffice: '',
    authorizedPerson: '',
    phone: '',
    email: '',
    contractStartDate: lastYear,
    contractEndDate: nextMonth,
    workDescription: 'İnşaat iskele kurulumu ve bakım',
    createdAt: lastYear,
    updatedAt: now,
  },
];

interface SubContractorState {
  subContractors: SubContractor[];
  addSubContractor: (data: Omit<SubContractor, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSubContractor: (id: string, data: Partial<Omit<SubContractor, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteSubContractor: (id: string) => void;
  getSubContractorById: (id: string) => SubContractor | undefined;
  fetchSubContractors: (mainCompanyId: string) => SubContractor[];
  loadData: (isDemo: boolean) => void;
}

function generateId(): string {
  return `sub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useSubContractorStore = create<SubContractorState>()(
  persist(
    (set, get) => ({
      subContractors: [],

      addSubContractor: (data) => {
        const now_ = new Date();
        const newItem: SubContractor = {
          ...data,
          taxNumber: data.taxNumber ?? '',
          taxOffice: data.taxOffice ?? '',
          authorizedPerson: data.authorizedPerson ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
          id: generateId(),
          createdAt: now_,
          updatedAt: now_,
        };
        set((state) => ({ subContractors: [...state.subContractors, newItem] }));
      },

      updateSubContractor: (id, updates) => {
        set((state) => ({
          subContractors: state.subContractors.map((item) =>
            item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
          ),
        }));
      },

      deleteSubContractor: (id) => {
        set((state) => ({ subContractors: state.subContractors.filter((item) => item.id !== id) }));
      },

      getSubContractorById: (id) => get().subContractors.find((item) => item.id === id),

      fetchSubContractors: (mainCompanyId) => {
        return get().subContractors.filter((item) => item.mainCompanyId === mainCompanyId);
      },

      loadData: (isDemo) => {
        if (isDemo) {
          set({ subContractors: [...MOCK_SUBCONTRACTORS] });
        } else {
          set({ subContractors: [] });
        }
      },
    }),
    { name: 'ohs-subcontractor-store' }
  )
);
