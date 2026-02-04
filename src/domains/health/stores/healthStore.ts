import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DangerClass } from '@store/companyStore';

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

/** Exam type for EK-2 */
export type ExamType = 'İşe Giriş' | 'Periyodik';

/** EK-2 İşe Giriş / Periyodik Muayene Formu */
export interface Examination {
  id: string;
  employeeId: string;
  employeeName: string;
  /** Optional for backward compat with persisted data */
  companyId?: string;
  examType?: ExamType;
  date: string; // ISO date (report date)
  /** Optional for backward compat; auto-calculated from danger class */
  validUntil?: string;
  anamnesis: Anamnesis;
  physical: Physical;
  labs: Labs;
  conclusion: Conclusion;
  /** Optional for backward compat */
  sentToIbys?: boolean;
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

/**
 * Auto-calculate Valid Until (Geçerlilik Tarihi) from report date and company hazard class.
 * Çok Tehlikeli -> +1 year, Tehlikeli -> +3 years, Az Tehlikeli -> +5 years.
 */
export function computeValidUntil(
  reportDateIso: string,
  dangerClass: DangerClass | undefined
): string {
  const d = new Date(reportDateIso);
  if (Number.isNaN(d.getTime())) return reportDateIso;
  const years =
    dangerClass === 'Çok Tehlikeli' ? 1 : dangerClass === 'Tehlikeli' ? 3 : 5;
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

/** Human-readable labels for IBYS validation errors */
const IBYS_FIELD_LABELS: Record<string, string> = {
  bloodPressure: 'Tansiyon',
  weight: 'Kilo',
  height: 'Boy',
  result: 'Sonuç (Kanaat)',
  nextExamDate: 'Sonraki Muayene Tarihi',
};

/**
 * Returns list of missing mandatory fields for IBYS submission.
 * Used in the İBYS Kontrol tab.
 */
export function getIbysValidationErrors(exam: Examination): string[] {
  const errors: string[] = [];
  if (!exam.physical?.bloodPressure?.trim()) errors.push(IBYS_FIELD_LABELS.bloodPressure);
  if ((exam.physical?.weight ?? 0) <= 0) errors.push(IBYS_FIELD_LABELS.weight);
  if ((exam.physical?.height ?? 0) <= 0) errors.push(IBYS_FIELD_LABELS.height);
  if (!exam.conclusion?.result) errors.push(IBYS_FIELD_LABELS.result);
  if (!exam.conclusion?.nextExamDate?.trim()) errors.push(IBYS_FIELD_LABELS.nextExamDate);
  return errors;
}

interface HealthState {
  examinations: Examination[];
  addExamination: (data: ExaminationInput) => Examination;
  updateExamination: (id: string, data: Partial<ExaminationInput>) => void;
  deleteExamination: (id: string) => void;
  getExaminationById: (id: string) => Examination | undefined;
  markSentToIbys: (id: string) => void;
  fetchExamsByEmployee: (employeeId: string) => Examination[];
  /** Exams whose validUntil is within the next N days (for dashboard) */
  getExamsExpiringWithinDays: (days: number) => Examination[];
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

export const defaultExaminationInput = (): Omit<
  ExaminationInput,
  'employeeId' | 'employeeName' | 'companyId' | 'examType' | 'date' | 'validUntil' | 'sentToIbys'
> => ({
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
        const bmi =
          data.physical.height > 0 && data.physical.weight > 0
            ? computeBmi(data.physical.weight, data.physical.height)
            : 0;
        const exam: Examination = {
          ...data,
          id: generateId(),
          physical: { ...data.physical, bmi },
          sentToIbys: data.sentToIbys ?? false,
          createdAt: now,
        };
        set((state) => ({ examinations: [exam, ...state.examinations] }));
        return exam;
      },

      updateExamination: (id, data) => {
        set((state) => {
          const exam = state.examinations.find((e) => e.id === id);
          if (!exam) return state;
          const nextPhysical = { ...exam.physical, ...data.physical };
          if (
            (data.physical?.height != null || data.physical?.weight != null) &&
            nextPhysical.height > 0 &&
            nextPhysical.weight > 0
          ) {
            nextPhysical.bmi = computeBmi(nextPhysical.weight, nextPhysical.height);
          }
          const next: Examination = {
            ...exam,
            ...data,
            physical: nextPhysical,
          };
          return {
            examinations: state.examinations.map((e) => (e.id === id ? next : e)),
          };
        });
      },

      deleteExamination: (id) => {
        set((state) => ({
          examinations: state.examinations.filter((e) => e.id !== id),
        }));
      },

      getExaminationById: (id) => get().examinations.find((e) => e.id === id),

      markSentToIbys: (id) => {
        set((state) => ({
          examinations: state.examinations.map((e) =>
            e.id === id ? { ...e, sentToIbys: true } : e
          ),
        }));
      },

      fetchExamsByEmployee: (employeeId) => {
        return get()
          .examinations.filter((e) => e.employeeId === employeeId)
          .sort((a, b) => (b.date > a.date ? 1 : -1));
      },

      getExamsExpiringWithinDays: (days) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const limit = new Date(today);
        limit.setDate(limit.getDate() + days);
        const limitStr = limit.toISOString().slice(0, 10);
        const todayStr = today.toISOString().slice(0, 10);
        return get()
          .examinations.filter(
            (e) => {
              const vu = e.validUntil;
              if (!vu) return false;
              return vu >= todayStr && vu <= limitStr;
            }
          )
          .sort((a, b) => ((a.validUntil ?? '') > (b.validUntil ?? '') ? 1 : -1));
      },
    }),
    { name: 'ohs-health-ek2', partialize: (s) => ({ examinations: s.examinations }) }
  )
);
