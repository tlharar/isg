import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExaminationFormValues } from '@domains/health/schemas/examinationSchema';

export type PhysicalFinding = 'Normal' | 'Anormal';
export type Conclusion = 'Çalışabilir' | 'Şartlı Çalışabilir' | 'Çalışamaz';
export type DangerousWorkEligible = 'Evet' | 'Hayır';

/** EK-2 İşe Giriş / Periyodik Muayene Formu record */
export interface Examination {
  id: string;
  employeeId: string;
  smokingAlcohol: string;
  chronicDiseases: string;
  pastSurgeries: string;
  heightCm?: number;
  weightKg?: number;
  systolicBp?: number;
  diastolicBp?: number;
  pulse?: number;
  vision?: PhysicalFinding;
  hearing?: PhysicalFinding;
  respiratory?: PhysicalFinding;
  musculoskeletal?: PhysicalFinding;
  chestXRay: string;
  audiometry: string;
  bloodValues: string;
  conclusion?: Conclusion;
  dangerousWorkEligible?: DangerousWorkEligible;
  reportDate: string; // ISO date string for persist
  nextExaminationDate: string;
  createdAt: string;
}

function generateId(): string {
  return `exam-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toDateString(d: Date | undefined): string {
  if (!d) return '';
  return d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10);
}

interface HealthState {
  examinations: Examination[];
  addExamination: (data: ExaminationFormValues) => Examination;
  getPatientHistory: (employeeId: string) => Examination[];
  getExaminationById: (id: string) => Examination | undefined;
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      examinations: [],

      addExamination: (data) => {
        const now = new Date().toISOString();
        const exam: Examination = {
          id: generateId(),
          employeeId: data.employeeId,
          smokingAlcohol: data.smokingAlcohol ?? '',
          chronicDiseases: data.chronicDiseases ?? '',
          pastSurgeries: data.pastSurgeries ?? '',
          heightCm: data.heightCm,
          weightKg: data.weightKg,
          systolicBp: data.systolicBp,
          diastolicBp: data.diastolicBp,
          pulse: data.pulse,
          vision: data.vision,
          hearing: data.hearing,
          respiratory: data.respiratory,
          musculoskeletal: data.musculoskeletal,
          chestXRay: data.chestXRay ?? '',
          audiometry: data.audiometry ?? '',
          bloodValues: data.bloodValues ?? '',
          conclusion: data.conclusion,
          dangerousWorkEligible: data.dangerousWorkEligible,
          reportDate: toDateString(data.reportDate),
          nextExaminationDate: toDateString(data.nextExaminationDate),
          createdAt: now,
        };
        set((state) => ({ examinations: [...state.examinations, exam] }));
        return exam;
      },

      getPatientHistory: (employeeId) => {
        return get().examinations
          .filter((e) => e.employeeId === employeeId)
          .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
      },

      getExaminationById: (id) => get().examinations.find((e) => e.id === id),
    }),
    { name: 'ohs-health', partialize: (s) => ({ examinations: s.examinations }) }
  )
);
