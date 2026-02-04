import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Equipment {
  id: string;
  companyId: string;
  name: string;
  standard: string;
  totalStock: number;
  currentStock: number;
}

/** Common PPE items for template quick-add */
export const PPE_TEMPLATES: string[] = [
  'Baret (EN 397)',
  'Kulaklık (EN 352)',
  'İş Eldiveni',
  'Toz Maskesi (FFP2)',
  'Emniyet Kemeri',
  'İş Ayakkabısı (S3)',
];

function generateId(): string {
  return `eq-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Find first equipment item matching name (and optionally company). Used to link request equipmentName to inventory. */
export function findEquipmentByName(name: string, companyId?: string): Equipment | undefined {
  const state = useEquipmentStore.getState();
  const normalized = name.trim().toLowerCase();
  if (!normalized) return undefined;
  const list = companyId
    ? state.items.filter((e) => e.companyId === companyId)
    : state.items;
  return list.find((e) => e.name.trim().toLowerCase() === normalized);
}

interface EquipmentState {
  items: Equipment[];
  addEquipment: (item: Omit<Equipment, 'id'>) => Equipment;
  updateEquipment: (id: string, data: Partial<Omit<Equipment, 'id'>>) => void;
  deleteEquipment: (id: string) => void;
  addFromTemplate: (templateNames: string[], defaultStock: number, companyId: string) => Equipment[];
  /** Decrement currentStock by amount (default 1). Clamped to 0. */
  decrementStock: (id: string, quantity?: number) => void;
  getEquipmentById: (id: string) => Equipment | undefined;
  findEquipmentByName: (name: string, companyId?: string) => Equipment | undefined;
  loadData: (isDemo: boolean) => void;
}

export const useEquipmentStore = create<EquipmentState>()(
  persist(
    (set, get) => ({
      items: [],

      addEquipment: (item) => {
        const equipment: Equipment = {
          ...item,
          id: generateId(),
        };
        set((state) => ({ items: [...state.items, equipment] }));
        return equipment;
      },

      updateEquipment: (id, data) => {
        set((state) => ({
          items: state.items.map((e) => (e.id === id ? { ...e, ...data } : e)),
        }));
      },

      deleteEquipment: (id) => {
        set((state) => ({ items: state.items.filter((e) => e.id !== id) }));
      },

      addFromTemplate: (templateNames, defaultStock, companyId) => {
        const added: Equipment[] = [];
        const stock = Math.max(0, Math.floor(defaultStock));
        templateNames.forEach((name) => {
          const equipment: Equipment = {
            id: generateId(),
            companyId,
            name,
            standard: '',
            totalStock: stock,
            currentStock: stock,
          };
          added.push(equipment);
        });
        set((state) => ({ items: [...added, ...state.items] }));
        return added;
      },

      decrementStock: (id, quantity = 1) => {
        const qty = Math.max(0, Math.floor(quantity));
        set((state) => ({
          items: state.items.map((e) =>
            e.id === id
              ? { ...e, currentStock: Math.max(0, e.currentStock - qty) }
              : e
          ),
        }));
      },

      getEquipmentById: (id) => get().items.find((e) => e.id === id),

      findEquipmentByName: (name, companyId) => {
        const normalized = name.trim().toLowerCase();
        if (!normalized) return undefined;
        const list = companyId
          ? get().items.filter((e) => e.companyId === companyId)
          : get().items;
        return list.find((e) => e.name.trim().toLowerCase() === normalized);
      },

      loadData: (isDemo) => {
        if (!isDemo) set({ items: [] });
      },
    }),
    { name: 'ohs-equipment', partialize: (s) => ({ items: s.items }) }
  )
);
