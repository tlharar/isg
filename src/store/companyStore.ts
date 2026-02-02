import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Company {
  id: string;
  name: string;
  taxNo: string;
  address: string;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface CompanyFormValues {
  name: string;
  taxNo: string;
  address: string;
}

const INITIAL_COMPANIES: Company[] = [
  { id: 'c1', name: 'Company A', taxNo: '1234567890', address: 'Address A, City' },
  { id: 'c2', name: 'Company B', taxNo: '0987654321', address: 'Address B, City' },
  { id: 'c3', name: 'Company C', taxNo: '1122334455', address: 'Address C, City' },
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
        const company: Company = { ...data, id: generateId() };
        set((state) => ({ companies: [...state.companies, company] }));
        return company;
      },

      updateCompany: (id: string, data: CompanyFormValues) => {
        set((state) => ({
          companies: state.companies.map((c) => (c.id === id ? { ...data, id } : c)),
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
