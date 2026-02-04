import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EducationType = 'İşe Başlama' | 'Temel Eğitim' | 'Mesleki Eğitim' | 'Yenileme';
export type EducationStatus = 'Planlandı' | 'Tamamlandı' | 'İptal';

export interface EducationTemplate {
  id: string;
  name: string;
  createdAt: Date;
}

/** @deprecated Use EducationTemplate */
export type PlanTemplate = EducationTemplate;

export interface EducationSession {
  id: string;
  title: string;
  type: EducationType;
  trainer: string;
  date: Date;
  validUntil: Date;
  durationHours: number;
  location: string;
  attendees: string[];
  status: EducationStatus;
  createdAt: Date;
  updatedAt: Date;
  isCompleted?: boolean;
}

const DEFAULT_TEMPLATES: EducationTemplate[] = [
  { id: 't1', name: 'Standart Yıllık İSG Planı', createdAt: new Date() },
];

function generateTemplateId(): string {
  return `edu-tpl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const MOCK_SESSIONS: EducationSession[] = [
  {
    id: 'edu-1',
    title: 'Temel İSG Eğitimi',
    type: 'Temel Eğitim',
    trainer: 'Ahmet Yılmaz (İSG Uzmanı)',
    date: new Date('2024-01-15'),
    validUntil: new Date('2026-01-15'),
    durationHours: 16,
    location: 'Toplantı Salonu A',
    attendees: ['Ali Demir', 'Ayşe Kaya', 'Mehmet Öz', 'Fatma Yıldız', 'Can Arslan'],
    status: 'Tamamlandı',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'edu-2',
    title: 'Yüksekte Çalışma Eğitimi',
    type: 'Mesleki Eğitim',
    trainer: 'Zeynep Aydın (İSG Uzmanı)',
    date: new Date('2024-02-20'),
    validUntil: new Date('2025-02-20'),
    durationHours: 8,
    location: 'Saha - Bina A',
    attendees: ['Ali Demir', 'Can Arslan', 'Emre Şahin'],
    status: 'Tamamlandı',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-20'),
  },
  {
    id: 'edu-3',
    title: 'İlk Yardım Eğitimi',
    type: 'Temel Eğitim',
    trainer: 'Dr. Elif Kara',
    date: new Date('2024-03-10'),
    validUntil: new Date('2026-03-10'),
    durationHours: 12,
    location: 'Revir',
    attendees: ['Ayşe Kaya', 'Fatma Yıldız', 'Zeynep Çelik', 'Ahmet Demir'],
    status: 'Tamamlandı',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-10'),
  },
  {
    id: 'edu-4',
    title: 'Yangın Güvenliği ve Söndürme Eğitimi',
    type: 'Temel Eğitim',
    trainer: 'Ahmet Yılmaz (İSG Uzmanı)',
    date: new Date('2024-04-25'),
    validUntil: new Date('2025-04-25'),
    durationHours: 4,
    location: 'Açık Alan - Yangın Tatbikat Sahası',
    attendees: ['Ali Demir', 'Mehmet Öz', 'Can Arslan', 'Emre Şahin', 'Ahmet Demir'],
    status: 'Tamamlandı',
    createdAt: new Date('2024-04-15'),
    updatedAt: new Date('2024-04-25'),
  },
  {
    id: 'edu-5',
    title: 'Elektrik İşlerinde Güvenlik',
    type: 'Mesleki Eğitim',
    trainer: 'Murat Kılıç (Elektrik Mühendisi)',
    date: new Date('2024-06-15'),
    validUntil: new Date('2025-06-15'),
    durationHours: 6,
    location: 'Teknik Atölye',
    attendees: ['Emre Şahin', 'Ahmet Demir'],
    status: 'Planlandı',
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'edu-6',
    title: 'Kimyasal Madde Güvenliği',
    type: 'Mesleki Eğitim',
    trainer: 'Zeynep Aydın (İSG Uzmanı)',
    date: new Date('2024-07-10'),
    validUntil: new Date('2025-07-10'),
    durationHours: 8,
    location: 'Laboratuvar',
    attendees: ['Ayşe Kaya', 'Fatma Yıldız', 'Zeynep Çelik'],
    status: 'Planlandı',
    createdAt: new Date('2024-06-20'),
    updatedAt: new Date('2024-06-20'),
  },
];

interface EducationState {
  sessions: EducationSession[];
  templates: EducationTemplate[];
  addSession: (session: Omit<EducationSession, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSession: (id: string, session: Partial<Omit<EducationSession, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteSession: (id: string) => void;
  getSessionById: (id: string) => EducationSession | undefined;
  addTemplate: (name: string) => void;
  deleteTemplate: (id: string) => void;
  toggleComplete: (id: string) => void;
  loadData: (isDemo: boolean) => void;
}

export const useEducationStore = create<EducationState>()(
  persist(
    (set, get) => ({
      sessions: [],
      templates: [...DEFAULT_TEMPLATES],

      addSession: (session) => {
        const now = new Date();
        const newSession: EducationSession = {
          ...session,
          id: `edu-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ sessions: [...state.sessions, newSession] }));
      },

      updateSession: (id, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s
          ),
        }));
      },

      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        }));
      },

      getSessionById: (id) => get().sessions.find((s) => s.id === id),

      addTemplate: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const template: EducationTemplate = {
          id: generateTemplateId(),
          name: trimmed,
          createdAt: new Date(),
        };
        set((state) => ({ templates: [...state.templates, template] }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }));
      },

      toggleComplete: (id) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, isCompleted: !s.isCompleted } : s
          ),
        }));
      },

      loadData: (isDemo) => {
        set({ sessions: isDemo ? [...MOCK_SESSIONS] : [] });
      },
    }),
    {
      name: 'ohs-education-store',
      partialize: (s) => ({ sessions: s.sessions, templates: s.templates }),
    }
  )
);
