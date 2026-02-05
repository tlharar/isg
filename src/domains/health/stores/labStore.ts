import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LabExamType =
  | 'AUDIOMETRY'
  | 'SFT'
  | 'HEMOGRAM'
  | 'XRAY'
  | 'EYE'
  | 'ECG'
  | 'OTHER';

export type LabExamStatus = 'REQUESTED' | 'UPLOADED' | 'REVIEWED';

export type DoctorEvaluation = 'NORMAL' | 'RISKY' | 'REFERRAL' | null;

export interface LabExam {
  id: string;
  workerId: string;
  type: LabExamType;
  requestDate: Date;
  uploadDate: Date | null;
  fileUrl: string | null;
  status: LabExamStatus;
  doctorEvaluation: DoctorEvaluation;
  doctorNotes: string;
}

function generateId(): string {
  return `lab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toDate(d: Date | string): Date {
  if (d instanceof Date) return d;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

interface LabState {
  exams: LabExam[];
  requestExam: (data: Omit<LabExam, 'id' | 'uploadDate' | 'fileUrl' | 'status' | 'doctorEvaluation' | 'doctorNotes'>) => LabExam;
  uploadResult: (id: string, fileUrl: string) => void;
  evaluateExam: (id: string, evaluation: DoctorEvaluation, notes: string) => void;
  deleteExam: (id: string) => void;
  getExamById: (id: string) => LabExam | undefined;
  getExamsByWorker: (workerId: string) => LabExam[];
}

export const useLabStore = create<LabState>()(
  persist(
    (set, get) => ({
      exams: [],

      requestExam: (data) => {
        const exam: LabExam = {
          ...data,
          id: generateId(),
          requestDate: toDate(data.requestDate),
          uploadDate: null,
          fileUrl: null,
          status: 'REQUESTED',
          doctorEvaluation: null,
          doctorNotes: '',
        };
        set((state) => ({ exams: [exam, ...state.exams] }));
        return exam;
      },

      uploadResult: (id, fileUrl) => {
        set((state) => ({
          exams: state.exams.map((e) =>
            e.id === id
              ? {
                  ...e,
                  fileUrl,
                  uploadDate: new Date(),
                  status: 'UPLOADED' as LabExamStatus,
                }
              : e
          ),
        }));
      },

      evaluateExam: (id, evaluation, notes) => {
        set((state) => ({
          exams: state.exams.map((e) =>
            e.id === id
              ? {
                  ...e,
                  doctorEvaluation: evaluation,
                  doctorNotes: notes,
                  status: 'REVIEWED' as LabExamStatus,
                }
              : e
          ),
        }));
      },

      deleteExam: (id) => {
        set((state) => ({ exams: state.exams.filter((e) => e.id !== id) }));
      },

      getExamById: (id) => get().exams.find((e) => e.id === id),

      getExamsByWorker: (workerId) =>
        get().exams
          .filter((e) => e.workerId === workerId)
          .sort((a, b) => toDate(b.requestDate).getTime() - toDate(a.requestDate).getTime()),
    }),
    {
      name: 'ohs-lab',
      partialize: (s) => ({ exams: s.exams }),
    }
  )
);
