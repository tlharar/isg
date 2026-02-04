import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Single drug line on a prescription */
export interface PrescriptionDrug {
  name: string;
  usageType: string; // e.g. 'Tok Karnına', 'Aç Karnına', 'Gece'
  dose: string; // e.g. '2x1', '1x1'
  boxCount: number;
  period: number; // days
}

/** Prescription status (E-Signature not ready → save only) */
export type PrescriptionStatus = 'Taslak' | 'Kaydedildi';

/** Full prescription record */
export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  tcNo: string;
  date: string; // ISO date
  diagnoses: string[];
  drugs: PrescriptionDrug[];
  status: PrescriptionStatus;
}

/** Mock ICD-10 diagnoses for search/autocomplete (code + name) */
export interface DiagnosisOption {
  code: string;
  name: string;
  label: string; // "J06.9 - Üst Solunum Yolu Enfeksiyonu"
}

/** Mock drug name for autocomplete */
export interface DrugOption {
  value: string;
  label: string;
}

const MOCK_DIAGNOSES: DiagnosisOption[] = [
  { code: 'J06.9', name: 'Üst Solunum Yolu Enfeksiyonu', label: 'J06.9 - Üst Solunum Yolu Enfeksiyonu' },
  { code: 'J00', name: 'Akut Nazofarenjit', label: 'J00 - Akut Nazofarenjit' },
  { code: 'J02.9', name: 'Akut Farenjit', label: 'J02.9 - Akut Farenjit' },
  { code: 'J03.9', name: 'Akut Tonsillit', label: 'J03.9 - Akut Tonsillit' },
  { code: 'M54.5', name: 'Bel Ağrısı', label: 'M54.5 - Bel Ağrısı' },
  { code: 'R51', name: 'Baş Ağrısı', label: 'R51 - Baş Ağrısı' },
  { code: 'K29.7', name: 'Gastrit', label: 'K29.7 - Gastrit' },
  { code: 'F32.9', name: 'Depresif Bozukluk', label: 'F32.9 - Depresif Bozukluk' },
  { code: 'E11.9', name: 'Tip 2 Diabetes Mellitus', label: 'E11.9 - Tip 2 Diabetes Mellitus' },
  { code: 'I10', name: 'Esansiyel Hipertansiyon', label: 'I10 - Esansiyel Hipertansiyon' },
  { code: 'J31.0', name: 'Kronik Rinit', label: 'J31.0 - Kronik Rinit' },
  { code: 'L23', name: 'Alerjik Kontakt Dermatit', label: 'L23 - Alerjik Kontakt Dermatit' },
];

const MOCK_DRUG_NAMES: DrugOption[] = [
  { value: 'Parol 500 mg Tablet', label: 'Parol 500 mg Tablet' },
  { value: 'Augmentin 1g Tablet', label: 'Augmentin 1g Tablet' },
  { value: 'Dolorex 550 mg Tablet', label: 'Dolorex 550 mg Tablet' },
  { value: 'Majezik 275 mg Tablet', label: 'Majezik 275 mg Tablet' },
  { value: 'Vermidon 500 mg Tablet', label: 'Vermidon 500 mg Tablet' },
  { value: 'Aferin Sinüs 500/30 mg', label: 'Aferin Sinüs 500/30 mg' },
  { value: 'Burun Spreyi (Tuzlu Su)', label: 'Burun Spreyi (Tuzlu Su)' },
  { value: 'Omeprol 20 mg Kapsül', label: 'Omeprol 20 mg Kapsül' },
  { value: 'Gaviscon Şurup', label: 'Gaviscon Şurup' },
  { value: 'Metpamid 10 mg Tablet', label: 'Metpamid 10 mg Tablet' },
  { value: 'Glucophage 850 mg Tablet', label: 'Glucophage 850 mg Tablet' },
  { value: 'Cipro 500 mg Tablet', label: 'Cipro 500 mg Tablet' },
  { value: 'Zinnat 500 mg Tablet', label: 'Zinnat 500 mg Tablet' },
  { value: 'Aspirin 100 mg Tablet', label: 'Aspirin 100 mg Tablet' },
  { value: 'Coraspin 100 mg Tablet', label: 'Coraspin 100 mg Tablet' },
];

/** Usage type options (kullanım) */
export const USAGE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Aç Karnına', label: 'Aç Karnına' },
  { value: 'Tok Karnına', label: 'Tok Karnına' },
  { value: 'Gece', label: 'Gece' },
  { value: 'Sabah', label: 'Sabah' },
  { value: 'İhtiyaç Halinde', label: 'İhtiyaç Halinde' },
  { value: 'Yemeklerle', label: 'Yemeklerle' },
];

function generateId(): string {
  return `rx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface PrescriptionState {
  prescriptions: Prescription[];
  /** Mock diagnoses for diagnosis search */
  diagnosisOptions: DiagnosisOption[];
  /** Mock drug names for medication search */
  drugOptions: DrugOption[];
  addPrescription: (data: Omit<Prescription, 'id' | 'date' | 'status'>) => Prescription;
  getDiagnosisOptions: () => DiagnosisOption[];
  getDrugOptions: () => DrugOption[];
  /** Filter diagnoses by search term */
  searchDiagnoses: (query: string) => DiagnosisOption[];
  /** Filter drugs by search term */
  searchDrugs: (query: string) => DrugOption[];
}

export const usePrescriptionStore = create<PrescriptionState>()(
  persist(
    (set, get) => ({
      prescriptions: [],
      diagnosisOptions: MOCK_DIAGNOSES,
      drugOptions: MOCK_DRUG_NAMES,

      addPrescription: (data) => {
        const prescription: Prescription = {
          ...data,
          id: generateId(),
          date: new Date().toISOString().slice(0, 10),
          status: 'Kaydedildi',
        };
        set((state) => ({ prescriptions: [prescription, ...state.prescriptions] }));
        return prescription;
      },

      getDiagnosisOptions: () => get().diagnosisOptions,
      getDrugOptions: () => get().drugOptions,

      searchDiagnoses: (query) => {
        const q = query.trim().toLowerCase();
        if (!q) return get().diagnosisOptions;
        return get().diagnosisOptions.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.code.toLowerCase().includes(q) ||
            d.label.toLowerCase().includes(q)
        );
      },

      searchDrugs: (query) => {
        const q = query.trim().toLowerCase();
        if (!q) return get().drugOptions;
        return get().drugOptions.filter(
          (d) => d.value.toLowerCase().includes(q) || d.label.toLowerCase().includes(q)
        );
      },
    }),
    { name: 'ohs-prescription', partialize: (s) => ({ prescriptions: s.prescriptions }) }
  )
);

/** Favori tanılar (mock) – common diagnoses to add quickly */
export const FAVORITE_DIAGNOSES: string[] = [
  'J06.9 - Üst Solunum Yolu Enfeksiyonu',
  'J00 - Akut Nazofarenjit',
  'M54.5 - Bel Ağrısı',
  'R51 - Baş Ağrısı',
];
