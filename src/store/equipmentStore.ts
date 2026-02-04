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

export interface EquipmentTemplate {
  id: string;
  name: string;
  type: string;
  standard: string;
  periodicCheckIntervalMonths: number;
}

const DEFAULT_TEMPLATES: EquipmentTemplate[] = [
  { id: 'tpl-1', name: 'Standart Baret', type: 'Koruyucu Başlık', standard: 'EN 397', periodicCheckIntervalMonths: 12 },
  { id: 'tpl-2', name: 'İş Eldiveni', type: 'Koruyucu Eldiven', standard: 'EN 388', periodicCheckIntervalMonths: 6 },
  { id: 'tpl-3', name: 'Kulaklık', type: 'İşitme Koruyucu', standard: 'EN 352', periodicCheckIntervalMonths: 12 },
  { id: 'tpl-4', name: 'Toz Maskesi (FFP2)', type: 'Solunum Koruyucu', standard: 'EN 149', periodicCheckIntervalMonths: 0 },
];

function generateId(): string {
  return `eq-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateTemplateId(): string {
  return `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
  templates: EquipmentTemplate[];
  addEquipment: (item: Omit<Equipment, 'id'>) => Equipment;
  updateEquipment: (id: string, data: Partial<Omit<Equipment, 'id'>>) => void;
  deleteEquipment: (id: string) => void;
  addTemplate: (template: Omit<EquipmentTemplate, 'id'>) => EquipmentTemplate;
  deleteTemplate: (id: string) => void;
  addFromTemplate: (templateId: string, companyId: string, defaultStock?: number) => Equipment | undefined;
  decrementStock: (id: string, quantity?: number) => void;
  getEquipmentById: (id: string) => Equipment | undefined;
  findEquipmentByName: (name: string, companyId?: string) => Equipment | undefined;
  loadData: (isDemo: boolean) => void;
}

export const useEquipmentStore = create<EquipmentState>()(
  persist(
    (set, get) => ({
      items: [],
      templates: [...DEFAULT_TEMPLATES],

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

      addTemplate: (template) => {
        const t: EquipmentTemplate = {
          ...template,
          id: generateTemplateId(),
        };
        set((state) => ({ templates: [...state.templates, t] }));
        return t;
      },

      deleteTemplate: (id) => {
        set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }));
      },

      addFromTemplate: (templateId, companyId, defaultStock = 50) => {
        const template = get().templates.find((t) => t.id === templateId);
        if (!template) return undefined;
        const stock = Math.max(0, Math.floor(defaultStock));
        const equipment: Equipment = {
          id: generateId(),
          companyId,
          name: template.name,
          standard: template.standard,
          totalStock: stock,
          currentStock: stock,
        };
        set((state) => ({ items: [equipment, ...state.items] }));
        return equipment;
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
    { name: 'ohs-equipment', partialize: (s) => ({ items: s.items, templates: s.templates }) }
  )
);
