import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MedicalCategory = 'DRUG' | 'CONSUMABLE' | 'EQUIPMENT';

export type MedicalUnit = 'BOX' | 'PIECE' | 'AMPULE' | 'LITER';

export type TransactionType = 'IN' | 'OUT';

/** Standard/template items for category-based autocomplete suggestions. */
export interface StandardMedicalItem {
  label: string;
  category: 'DRUG' | 'CONSUMABLE';
  defaultUnit: MedicalUnit;
}

export const STANDARD_MEDICAL_ITEMS: StandardMedicalItem[] = [
  { label: 'Parol 500mg Tablet', category: 'DRUG', defaultUnit: 'BOX' },
  { label: 'Arveles Ampul', category: 'DRUG', defaultUnit: 'AMPULE' },
  { label: 'Baticon', category: 'DRUG', defaultUnit: 'BOX' },
  { label: 'Augmentin', category: 'DRUG', defaultUnit: 'BOX' },
  { label: 'Sargı Bezi', category: 'CONSUMABLE', defaultUnit: 'PIECE' },
  { label: 'Yara Bandı', category: 'CONSUMABLE', defaultUnit: 'BOX' },
  { label: 'Enjektör 5cc', category: 'CONSUMABLE', defaultUnit: 'PIECE' },
  { label: 'Maske', category: 'CONSUMABLE', defaultUnit: 'PIECE' },
];

/** Returns suggestion labels (product names) for the given category. EQUIPMENT returns empty (no templates). */
export function getSuggestionsByCategory(category: string): string[] {
  if (category !== 'DRUG' && category !== 'CONSUMABLE') return [];
  return STANDARD_MEDICAL_ITEMS.filter((i) => i.category === category).map((i) => i.label);
}

/** Returns the standard item for a given label, if any (used to auto-fill defaultUnit on selection). */
export function findStandardItemByLabel(label: string): StandardMedicalItem | undefined {
  return STANDARD_MEDICAL_ITEMS.find((i) => i.label === label);
}

export interface MedicalItem {
  id: string;
  name: string;
  category: MedicalCategory;
  stockQuantity: number;
  unit: MedicalUnit;
  criticalThreshold: number;
  expiryDate: Date;
  batchNumber: string;
  location: string;
}

export interface StockTransaction {
  id: string;
  itemId: string;
  date: Date;
  type: TransactionType;
  quantity: number;
  reason: string;
  performedBy: string;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toDate(d: Date | string): Date {
  if (d instanceof Date) return d;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const out = new Date(date);
  out.setMonth(out.getMonth() + months);
  return out;
}

interface PharmacyState {
  items: MedicalItem[];
  transactions: StockTransaction[];
  addItem: (data: Omit<MedicalItem, 'id'>) => MedicalItem;
  updateItem: (id: string, data: Partial<Omit<MedicalItem, 'id'>>) => void;
  deleteItem: (id: string) => void;
  adjustStock: (itemId: string, quantity: number, type: TransactionType, reason: string, performedBy: string) => void;
  getItemById: (id: string) => MedicalItem | undefined;
  getExpiredItems: () => MedicalItem[];
  getLowStockItems: () => MedicalItem[];
  /** Items expiring within the given number of months (excluding already expired). */
  getExpiringWithinMonths: (months: number) => MedicalItem[];
}

export const usePharmacyStore = create<PharmacyState>()(
  persist(
    (set, get) => ({
      items: [],
      transactions: [],

      addItem: (data) => {
        const item: MedicalItem = {
          ...data,
          id: generateId('ph'),
          expiryDate: toDate(data.expiryDate),
        };
        set((state) => ({ items: [item, ...state.items] }));
        return item;
      },

      updateItem: (id, data) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  ...data,
                  expiryDate: data.expiryDate ? toDate(data.expiryDate) : i.expiryDate,
                }
              : i
          ),
        }));
      },

      deleteItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
          transactions: state.transactions.filter((t) => t.itemId !== id),
        }));
      },

      adjustStock: (itemId, quantity, type, reason, performedBy) => {
        if (quantity <= 0) return;
        const item = get().getItemById(itemId);
        if (!item) return;
        const newQty = type === 'IN' ? item.stockQuantity + quantity : item.stockQuantity - quantity;
        if (newQty < 0) return;
        const tx: StockTransaction = {
          id: generateId('tx'),
          itemId,
          date: new Date(),
          type,
          quantity,
          reason,
          performedBy,
        };
        set((state) => ({
          items: state.items.map((i) =>
            i.id === itemId ? { ...i, stockQuantity: newQty } : i
          ),
          transactions: [tx, ...state.transactions],
        }));
      },

      getItemById: (id) => get().items.find((i) => i.id === id),

      getExpiredItems: () => {
        const today = todayStart();
        return get().items.filter((i) => toDate(i.expiryDate).getTime() < today.getTime());
      },

      getLowStockItems: () => {
        return get().items.filter((i) => i.stockQuantity <= i.criticalThreshold);
      },

      getExpiringWithinMonths: (months) => {
        const today = todayStart();
        const limit = addMonths(today, months);
        return get().items.filter((i) => {
          const exp = toDate(i.expiryDate);
          return exp.getTime() >= today.getTime() && exp.getTime() <= limit.getTime();
        });
      },
    }),
    {
      name: 'ohs-pharmacy',
      partialize: (s) => ({ items: s.items, transactions: s.transactions }),
    }
  )
);
