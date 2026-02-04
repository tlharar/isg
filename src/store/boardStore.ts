import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MeetingStatus = 'Planned' | 'Completed';

export interface MeetingDecision {
  id: string;
  text: string;
  responsible: string;
  deadline: string; // ISO date YYYY-MM-DD
}

export interface Meeting {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  agenda: string;
  attendees: string[];
  decisions: MeetingDecision[];
  status: MeetingStatus;
  minutesFile: string | null;
  generalNotes?: string;
}

export type BookEntryCategory = 'Technical' | 'Health' | 'Administrative';
export type BookEntryStatus = 'Open' | 'Closed';

export interface BookEntry {
  id: string;
  pageNumber: number;
  date: string; // ISO date YYYY-MM-DD
  detection: string;
  suggestion: string;
  category: BookEntryCategory;
  status: BookEntryStatus;
  closingDate: string | null; // ISO date YYYY-MM-DD
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const today = (): string => new Date().toISOString().slice(0, 10);
const daysFrom = (iso: string, days: number): string => {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const MOCK_MEETINGS: Meeting[] = [
  {
    id: 'mtg-1',
    date: daysFrom(today(), -60),
    agenda: 'Yıllık İSG değerlendirmesi, risk analizi güncellemesi, acil durum tatbikatı planı.',
    attendees: ['Ahmet Yılmaz', 'Fatma Demir', 'Mehmet Kaya', 'Ayşe Öz'],
    decisions: [
      { id: 'dec-1a', text: 'Risk analizi 2. çeyrekte güncellenecek.', responsible: 'Ahmet Yılmaz', deadline: daysFrom(today(), -30) },
      { id: 'dec-1b', text: 'Tatbikat tarihi belirlenecek.', responsible: 'Fatma Demir', deadline: daysFrom(today(), -20) },
    ],
    status: 'Completed',
    minutesFile: 'tutanak-2024-q4.pdf',
  },
  {
    id: 'mtg-2',
    date: daysFrom(today(), -30),
    agenda: 'Periyodik kontroller, eğitim planı, DÖF takibi.',
    attendees: ['Ahmet Yılmaz', 'Fatma Demir', 'Mehmet Kaya'],
    decisions: [
      { id: 'dec-2a', text: 'Eksik periyodik kontroller tamamlanacak.', responsible: 'Mehmet Kaya', deadline: daysFrom(today(), 7) },
    ],
    status: 'Completed',
    minutesFile: 'tutanak-ocak-2025.pdf',
  },
  {
    id: 'mtg-3',
    date: daysFrom(today(), 14),
    agenda: '1. çeyrek değerlendirme, yeni talimatların gözden geçirilmesi.',
    attendees: [],
    decisions: [],
    status: 'Planned',
    minutesFile: null,
  },
];

const MOCK_BOOK_ENTRIES: BookEntry[] = [
  {
    id: 'book-1',
    pageNumber: 1,
    date: daysFrom(today(), -45),
    detection: 'Depo B yangın söndürme tüpü etiket süresi dolmuş.',
    suggestion: 'Tüpün periyodik kontrolü yaptırılmalı.',
    category: 'Technical',
    status: 'Closed',
    closingDate: daysFrom(today(), -40),
  },
  {
    id: 'book-2',
    pageNumber: 2,
    date: daysFrom(today(), -20),
    detection: 'Atölye gürültü seviyesi ölçümü yapılmamış.',
    suggestion: 'Gürültü ölçümü ve kulaklık tedariki yapılmalı.',
    category: 'Health',
    status: 'Open',
    closingDate: null,
  },
  {
    id: 'book-3',
    pageNumber: 3,
    date: daysFrom(today(), -10),
    detection: 'İSG talimatları yeni çalışanlara imzalatılmamış.',
    suggestion: 'İşe girişte talimat formu zorunlu tutulmalı.',
    category: 'Administrative',
    status: 'Open',
    closingDate: null,
  },
];

export interface CompleteMeetingPayload {
  decisions: MeetingDecision[];
  minutesFile?: string | null;
  generalNotes?: string;
}

interface BoardState {
  meetings: Meeting[];
  bookEntries: BookEntry[];
  addMeeting: (data: Omit<Meeting, 'id'>) => Meeting;
  completeMeeting: (id: string, payload: CompleteMeetingPayload) => void;
  getMeetingById: (id: string) => Meeting | undefined;
  addBookEntry: (data: Omit<BookEntry, 'id'>) => BookEntry;
  closeBookEntry: (id: string, closingDate: string) => void;
  getNextPageNumber: () => number;
  loadData: (isDemo: boolean) => void;
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      meetings: MOCK_MEETINGS,
      bookEntries: MOCK_BOOK_ENTRIES,

      addMeeting: (data) => {
        const meeting: Meeting = {
          ...data,
          id: genId('mtg'),
        };
        set((s) => ({ meetings: [meeting, ...s.meetings] }));
        return meeting;
      },

      completeMeeting: (id, payload) => {
        set((s) => ({
          meetings: s.meetings.map((m) =>
            m.id === id
              ? {
                  ...m,
                  status: 'Completed' as const,
                  decisions: payload.decisions,
                  minutesFile: payload.minutesFile ?? m.minutesFile,
                  generalNotes: payload.generalNotes,
                }
              : m
          ),
        }));
      },

      getMeetingById: (id) => get().meetings.find((m) => m.id === id),

      addBookEntry: (data) => {
        const entry: BookEntry = {
          ...data,
          id: genId('book'),
        };
        set((s) => ({ bookEntries: [...s.bookEntries, entry] }));
        return entry;
      },

      closeBookEntry: (id, closingDate) => {
        set((s) => ({
          bookEntries: s.bookEntries.map((e) =>
            e.id === id ? { ...e, status: 'Closed' as const, closingDate } : e
          ),
        }));
      },

      getNextPageNumber: () => {
        const entries = get().bookEntries;
        if (entries.length === 0) return 1;
        return Math.max(...entries.map((e) => e.pageNumber), 0) + 1;
      },

      loadData: (isDemo) => {
        if (isDemo) {
          set({ meetings: [...MOCK_MEETINGS], bookEntries: [...MOCK_BOOK_ENTRIES] });
        } else {
          set({ meetings: [], bookEntries: [] });
        }
      },
    }),
    { name: 'ohs-board', partialize: (s) => ({ meetings: s.meetings, bookEntries: s.bookEntries }) }
  )
);
