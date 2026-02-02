import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CompanyFormValues } from '@domains/company/schemas/companySchema';

export type CompanyStatus = 'active' | 'passive';

export interface Company {
  id: string;
  name: string;
  taxNo: string;
  address: string;
  /** SGK Registration No (SGK Sicil No) */
  sgkNo: string;
  city: string;
  district: string;
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

const INITIAL_COMPANIES: Company[] = [
  {
    id: 'c1',
    name: 'Company A',
    taxNo: '1234567890',
    address: 'Address A, Istanbul',
    sgkNo: 'SGK-001',
    city: 'istanbul',
    district: 'kadikoy',
    status: 'active',
    employeeCountSystem: 45,
    employeeCountIsgKatip: 42,
  },
  {
    id: 'c2',
    name: 'Company B',
    taxNo: '0987654321',
    address: 'Address B, Ankara',
    sgkNo: 'SGK-002',
    city: 'ankara',
    district: 'cankaya',
    status: 'active',
    employeeCountSystem: 120,
    employeeCountIsgKatip: 118,
  },
  {
    id: 'c3',
    name: 'Company C',
    taxNo: '1122334455',
    address: 'Address C, Izmir',
    sgkNo: 'SGK-003',
    city: 'izmir',
    district: 'konak',
    status: 'passive',
    employeeCountSystem: 0,
    employeeCountIsgKatip: 0,
  },
];

interface CompanyState {
  companies: Company[];
  addCompany: (data: CompanyFormValues) => Company;
  updateCompany: (id: string, data: CompanyFormValues) => void;
  deleteCompany: (id: string) => void;
  getCompanyById: (id: string) => Company | undefined;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set, get) => ({
      companies: INITIAL_COMPANIES,

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
    }),
    { name: 'ohs-companies', partialize: (state) => ({ companies: state.companies }) }
  )
);
