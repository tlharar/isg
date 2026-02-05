import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** İstirahat Raporu / Medical Report / Sick Leave */
export interface MedicalReport {
  id: string;
  patientId: string;
  patientName: string;
  tcNo: string;
  prescriptionId?: string;
  startDate: Date;
  endDate: Date;
  days: number;
  diagnosis: string;
  description: string;
  returnToWorkDate: Date;
  checkupRequired: boolean;
  createdAt: Date;
}

function generateId(): string {
  return `report-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toDate(d: Date | string): Date {
  if (d instanceof Date) return d;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

interface MedicalReportState {
  reports: MedicalReport[];
  addReport: (data: Omit<MedicalReport, 'id' | 'createdAt'>) => MedicalReport;
  getReportsByPatient: (patientId: string) => MedicalReport[];
  getReportById: (id: string) => MedicalReport | undefined;
}

export const useMedicalReportStore = create<MedicalReportState>()(
  persist(
    (set, get) => ({
      reports: [],

      addReport: (data) => {
        const report: MedicalReport = {
          ...data,
          id: generateId(),
          startDate: toDate(data.startDate),
          endDate: toDate(data.endDate),
          returnToWorkDate: toDate(data.returnToWorkDate),
          createdAt: new Date(),
        };
        set((state) => ({ reports: [report, ...state.reports] }));
        return report;
      },

      getReportsByPatient: (patientId) => {
        return get().reports.filter((r) => r.patientId === patientId);
      },

      getReportById: (id) => get().reports.find((r) => r.id === id),
    }),
    { name: 'ohs-medical-reports', partialize: (s) => ({ reports: s.reports }) }
  )
);
