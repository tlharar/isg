import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DrugType = 'Tablet' | 'Şurup' | 'Ampul' | 'Krem';

export interface Drug {
  id: string;
  barcode: string;
  name: string;
  type: DrugType;
  activeIngredient: string;
}

const DRUG_TYPES: DrugType[] = ['Tablet', 'Şurup', 'Ampul', 'Krem'];

const MOCK_DRUGS: Drug[] = [
  { id: '1', barcode: '8690000001001', name: 'Parol 500 mg', type: 'Tablet', activeIngredient: 'Parasetamol' },
  { id: '2', barcode: '8690000001002', name: 'Arveles 25 mg', type: 'Tablet', activeIngredient: 'Dexketoprofen' },
  { id: '3', barcode: '8690000001003', name: 'Augmentin 1000 mg', type: 'Tablet', activeIngredient: 'Amoksisilin + Klavulanik asit' },
  { id: '4', barcode: '8690000001004', name: 'Majezik 275 mg', type: 'Tablet', activeIngredient: 'Tiaprofenik asit' },
  { id: '5', barcode: '8690000001005', name: 'Muscoril 4 mg', type: 'Tablet', activeIngredient: 'Tiyokolşikosid' },
  { id: '6', barcode: '8690000001006', name: 'Dolorex 550 mg', type: 'Tablet', activeIngredient: 'Naproksen' },
  { id: '7', barcode: '8690000001007', name: 'Vermidon 500 mg', type: 'Tablet', activeIngredient: 'Parasetamol + Kafein' },
  { id: '8', barcode: '8690000001008', name: 'Aferin Sinüs', type: 'Tablet', activeIngredient: 'Parasetamol + Pseudoefedrin' },
  { id: '9', barcode: '8690000001009', name: 'Omeprol 20 mg', type: 'Tablet', activeIngredient: 'Omeprazol' },
  { id: '10', barcode: '8690000001010', name: 'Gaviscon', type: 'Şurup', activeIngredient: 'Sodyum aljinat' },
  { id: '11', barcode: '8690000001011', name: 'Metpamid 10 mg', type: 'Tablet', activeIngredient: 'Metoklopramid' },
  { id: '12', barcode: '8690000001012', name: 'Glucophage 850 mg', type: 'Tablet', activeIngredient: 'Metformin' },
  { id: '13', barcode: '8690000001013', name: 'Cipro 500 mg', type: 'Tablet', activeIngredient: 'Siprofloksasin' },
  { id: '14', barcode: '8690000001014', name: 'Zinnat 500 mg', type: 'Tablet', activeIngredient: 'Sefuroksim' },
  { id: '15', barcode: '8690000001015', name: 'Bepanthol Krem', type: 'Krem', activeIngredient: 'Dexpanthenol' },
];

function generateId(): string {
  return `drug-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface DrugState {
  drugs: Drug[];
  addDrug: (data: Omit<Drug, 'id'>) => Drug;
  deleteDrug: (id: string) => void;
  searchDrugs: (query: string) => Drug[];
}

export const useDrugStore = create<DrugState>()(
  persist(
    (set, get) => ({
      drugs: MOCK_DRUGS,

      addDrug: (data) => {
        const drug: Drug = {
          ...data,
          id: generateId(),
        };
        set((state) => ({ drugs: [...state.drugs, drug] }));
        return drug;
      },

      deleteDrug: (id) => {
        set((state) => ({ drugs: state.drugs.filter((d) => d.id !== id) }));
      },

      searchDrugs: (query) => {
        const q = query.trim().toLowerCase();
        if (!q) return get().drugs;
        return get().drugs.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.barcode.toLowerCase().includes(q) ||
            d.activeIngredient.toLowerCase().includes(q)
        );
      },
    }),
    { name: 'ohs-drugs', partialize: (s) => ({ drugs: s.drugs }) }
  )
);

export { DRUG_TYPES };
