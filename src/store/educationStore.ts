import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EducationType = 'İşe Başlama' | 'Temel Eğitim' | 'Mesleki Eğitim' | 'Yenileme';
export type EducationStatus = 'Planlandı' | 'Tamamlandı' | 'İptal';

export interface EducationSession {
  id: string;
  title: string;
  type: EducationType;
  trainer: string;
  date: Date;
  validUntil: Date;
  durationHours: number;
  location: string;
  attendees: string[]; // Names or IDs of workers
  status: EducationStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface EducationState {
  sessions: EducationSession[];
  addSession: (session: Omit<EducationSession, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSession: (id: string, session: Partial<Omit<EducationSession, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteSession: (id: string) => void;
  getSessionById: (id: string) => EducationSession | undefined;
}

// Mock data for initial sessions
const mockSessions: EducationSession[] = [
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

export const useEducationStore = create<EducationState>()(
  persist(
    (set, get) => ({
      sessions: mockSessions,
      addSession: (session) => {
        const now = new Date();
        const newSession: EducationSession = {
          ...session,
          id: `edu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ sessions: [...state.sessions, newSession] }));
      },
      updateSession: (id, updates) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id
              ? { ...session, ...updates, updatedAt: new Date() }
              : session
          ),
        }));
      },
      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== id),
        }));
      },
      getSessionById: (id) => {
        return get().sessions.find((session) => session.id === id);
      },
    }),
    {
      name: 'ohs-education-store',
    }
  )
);
