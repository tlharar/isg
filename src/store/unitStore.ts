import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type HazardClass = 'Az Tehlikeli' | 'Tehlikeli' | 'Çok Tehlikeli';

export interface Unit {
  id: string;
  companyId: string;
  name: string;
  managerName: string;
  hazardClass: HazardClass;
  description: string;
  employeeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface UnitState {
  units: Unit[];
  addUnit: (unit: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateUnit: (id: string, unit: Partial<Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteUnit: (id: string) => void;
  getUnitById: (id: string) => Unit | undefined;
  fetchUnitsByCompany: (companyId: string) => Unit[];
}

function generateId(): string {
  return `unit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Mock data for initial setup
const MOCK_UNITS: Unit[] = [
  {
    id: 'unit-1',
    companyId: 'c1',
    name: 'Boyahane',
    managerName: 'Mehmet Yılmaz',
    hazardClass: 'Çok Tehlikeli',
    description: 'Boya ve kimyasal maddelerin kullanıldığı üretim alanı',
    employeeCount: 15,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'unit-2',
    companyId: 'c1',
    name: 'Montaj Hattı',
    managerName: 'Ayşe Demir',
    hazardClass: 'Tehlikeli',
    description: 'Ürün montaj ve kalite kontrol bölümü',
    employeeCount: 25,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'unit-3',
    companyId: 'c1',
    name: 'Depo',
    managerName: 'Ali Kaya',
    hazardClass: 'Tehlikeli',
    description: 'Hammadde ve ürün depolama alanı',
    employeeCount: 8,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: 'unit-4',
    companyId: 'c1',
    name: 'İdari Ofis',
    managerName: 'Zeynep Şahin',
    hazardClass: 'Az Tehlikeli',
    description: 'Yönetim ve idari işler ofisi',
    employeeCount: 12,
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
  },
  {
    id: 'unit-5',
    companyId: 'c2',
    name: 'Üretim Sahası',
    managerName: 'Hasan Çelik',
    hazardClass: 'Çok Tehlikeli',
    description: 'Ana üretim ve işleme alanı',
    employeeCount: 45,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'unit-6',
    companyId: 'c2',
    name: 'Kalite Kontrol',
    managerName: 'Fatma Arslan',
    hazardClass: 'Az Tehlikeli',
    description: 'Ürün kalite kontrol ve test laboratuvarı',
    employeeCount: 6,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
];

export const useUnitStore = create<UnitState>()(
  persist(
    (set, get) => ({
      units: MOCK_UNITS,
      
      addUnit: (unitData) => {
        const now = new Date();
        const newUnit: Unit = {
          ...unitData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ units: [...state.units, newUnit] }));
      },
      
      updateUnit: (id, updates) => {
        set((state) => ({
          units: state.units.map((unit) =>
            unit.id === id ? { ...unit, ...updates, updatedAt: new Date() } : unit
          ),
        }));
      },
      
      deleteUnit: (id) => {
        set((state) => ({ units: state.units.filter((unit) => unit.id !== id) }));
      },
      
      getUnitById: (id) => get().units.find((unit) => unit.id === id),
      
      fetchUnitsByCompany: (companyId) => {
        return get().units.filter((unit) => unit.companyId === companyId);
      },
    }),
    {
      name: 'ohs-unit-store',
    }
  )
);
