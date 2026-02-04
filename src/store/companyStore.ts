import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CompanyFormValues } from '@domains/company/schemas/companySchema';

export type CompanyStatus = 'active' | 'passive';

/** Tehlike Sınıfı (OHS hazard class) */
export type DangerClass = 'Az Tehlikeli' | 'Tehlikeli' | 'Çok Tehlikeli';

export interface Company {
  id: string;
  /** Firma Unvanı */
  name: string;
  /** 6-digit sector code (NACE) */
  naceCode: string;
  /** Tehlike Sınıfı */
  dangerClass?: DangerClass;
  sector: string;
  /** SGK Sicil No - critical for OHS */
  sgkSicilNo: string;
  /** Vergi Dairesi */
  taxOffice: string;
  /** Vergi No */
  taxNumber: string;
  city: string;
  /** İlçe */
  district: string;
  address: string;
  phone: string;
  email: string;
  status: CompanyStatus;
  /** Active employee count from system */
  employeeCountSystem: number;
  /** Active employee count from ISG Katip */
  employeeCountIsgKatip: number;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export type { CompanyFormValues };

/** Kept outside store for reuse (e.g. loadData). */
const MOCK_COMPANIES: Company[] = [
  {
    id: 'c1',
    name: 'Company A',
    naceCode: '41201',
    dangerClass: 'Tehlikeli',
    sector: 'İnşaat',
    sgkSicilNo: 'SGK-001',
    taxOffice: 'Kadıköy',
    taxNumber: '1234567890',
    city: 'İstanbul',
    district: 'Kadıköy',
    address: 'Address A, Istanbul',
    phone: '+90 216 123 45 67',
    email: 'info@companya.com',
    status: 'active',
    employeeCountSystem: 45,
    employeeCountIsgKatip: 42,
  },
  {
    id: 'c2',
    name: 'Company B',
    naceCode: '35110',
    dangerClass: 'Çok Tehlikeli',
    sector: 'Enerji',
    sgkSicilNo: 'SGK-002',
    taxOffice: 'Çankaya',
    taxNumber: '0987654321',
    city: 'Ankara',
    district: 'Çankaya',
    address: 'Address B, Ankara',
    phone: '+90 312 456 78 90',
    email: 'info@companyb.com',
    status: 'active',
    employeeCountSystem: 120,
    employeeCountIsgKatip: 118,
  },
  {
    id: 'c3',
    name: 'Company C',
    naceCode: '56101',
    dangerClass: 'Az Tehlikeli',
    sector: 'Hizmet',
    sgkSicilNo: 'SGK-003',
    taxOffice: 'Konak',
    taxNumber: '1122334455',
    city: 'İzmir',
    district: 'Konak',
    address: 'Address C, Izmir',
    phone: '',
    email: '',
    status: 'passive',
    employeeCountSystem: 0,
    employeeCountIsgKatip: 0,
  },
];

interface CompanyState {
  companies: Company[];
  addCompany: (data: CompanyFormValues) => Company;
  addCompanyBulk: (companies: Omit<Company, 'id' | 'employeeCountSystem' | 'employeeCountIsgKatip'>[]) => void;
  updateCompany: (id: string, data: CompanyFormValues) => void;
  deleteCompany: (id: string) => void;
  getCompanyById: (id: string) => Company | undefined;
  loadData: (isDemo: boolean) => void;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set, get) => ({
      companies: [],

      addCompany: (data: CompanyFormValues) => {
        const company: Company = {
          ...data,
          id: generateId(),
          employeeCountSystem: 0,
          employeeCountIsgKatip: 0,
        };
        set((state) => ({ companies: [...state.companies, company] }));
        return company;
      },

      addCompanyBulk: (companiesData) => {
        const newCompanies: Company[] = companiesData.map((data) => ({
          ...data,
          id: generateId(),
          employeeCountSystem: 0,
          employeeCountIsgKatip: 0,
        }));
        set((state) => ({ companies: [...state.companies, ...newCompanies] }));
      },

      updateCompany: (id: string, data: CompanyFormValues) => {
        set((state) => ({
          companies: state.companies.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        }));
      },

      deleteCompany: (id: string) => {
        set((state) => ({ companies: state.companies.filter((c) => c.id !== id) }));
      },

      getCompanyById: (id: string) => get().companies.find((c) => c.id === id),

      loadData: (isDemo) => {
        if (isDemo) set({ companies: [...MOCK_COMPANIES] });
        else set({ companies: [] });
      },
    }),
    { name: 'ohs-companies', partialize: (state) => ({ companies: state.companies }) }
  )
);
