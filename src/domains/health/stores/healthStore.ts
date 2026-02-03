import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Anamnez (history) section of EK-2 */
export interface Anamnesis {
  smoking: boolean;
  alcohol: boolean;
  chronicIllnesses: string;
  surgeries: string;
}

/** Physical exam: vision/hearing use Normal | Kusurlu */
export type PhysicalFinding = 'Normal' | 'Kusurlu';

export interface Physical {
  height: number;
  weight: number;
  bmi: number;
  bloodPressure: string;
  heartRate: number;
  vision: PhysicalFinding;
  hearing: PhysicalFinding;
}

export interface Labs {
  bloodAnalysis: string;
  audiometry: string;
  lungXray: string;
}

/** Result: Elverişli | Şartlı | Elverişsiz */
export type ConclusionResult = 'Elverişli' | 'Şartlı' | 'Elverişsiz';

export interface Conclusion {
  result: ConclusionResult;
  nextExamDate: string; // ISO date for persist
  conditions: string;
}

/** EK-2 İşe Giriş / Periyodik Muayene Formu */
export interface Examination {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // ISO date
  anamnesis: Anamnesis;
  physical: Physical;
  labs: Labs;
  conclusion: Conclusion;
  createdAt: string;
}

export type ExaminationInput = Omit<Examination, 'id' | 'createdAt'>;

function generateId(): string {
  return `exam-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function computeBmi(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

interface HealthState {
  examinations: Examination[];
  addExamination: (data: ExaminationInput) => Examination;
  fetchExamsByEmployee: (employeeId: string) => Examination[];
}

const defaultAnamnesis: Anamnesis = {
  smoking: false,
  alcohol: false,
  chronicIllnesses: '',
  surgeries: '',
};

const defaultPhysical: Physical = {
  height: 0,
  weight: 0,
  bmi: 0,
  bloodPressure: '',
  heartRate: 0,
  vision: 'Normal',
  hearing: 'Normal',
};

const defaultLabs: Labs = {
  bloodAnalysis: '',
  audiometry: '',
  lungXray: '',
};

const defaultConclusion: Conclusion = {
  result: 'Elverişli',
  nextExamDate: '',
  conditions: '',
};

export const defaultExaminationInput = (): Omit<ExaminationInput, 'employeeId' | 'employeeName' | 'date'> => ({
  anamnesis: { ...defaultAnamnesis },
  physical: { ...defaultPhysical },
  labs: { ...defaultLabs },
  conclusion: { ...defaultConclusion },
});

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      examinations: [],

      addExamination: (data) => {
        const now = new Date().toISOString();
        const bmi = data.physical.height > 0 && data.physical.weight > 0
          ? computeBmi(data.physical.weight, data.physical.height)
          : 0;
        const exam: Examination = {
          ...data,
          id: generateId(),
          physical: { ...data.physical, bmi },
          createdAt: now,
        };
        set((state) => ({ examinations: [exam, ...state.examinations] }));
        return exam;
      },

      fetchExamsByEmployee: (employeeId) => {
        return get().examinations
          .filter((e) => e.employeeId === employeeId)
          .sort((a, b) => (b.date > a.date ? 1 : -1));
      },
    }),
    { name: 'ohs-health-ek2', partialize: (s) => ({ examinations: s.examinations }) }
  )
);
