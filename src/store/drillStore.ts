import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DrillType = 'Fire' | 'Earthquake' | 'Evacuation' | 'Leak';

export type DrillStatus = 'Planned' | 'Completed' | 'Cancelled';

export interface DrillReportData {
  completionDate: string; // ISO date
  durationMinutes: number;
  participantsCount: number;
  successRating: number; // 1-5
  notes: string;
  photos: string[]; // mock URLs or data URLs
}

export interface Drill {
  id: string;
  type: DrillType;
  plannedDate: string; // ISO date
  status: DrillStatus;
  targetLocation?: string;
  completionDate?: string;
  durationMinutes?: number;
  participantsCount?: number;
  successRating?: number;
  notes?: string;
  photos?: string[];
}

function generateId(): string {
  return `drill-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const nextMonth = new Date();
nextMonth.setMonth(nextMonth.getMonth() + 1);

/** Kept outside store for reuse (e.g. loadData). */
export const MOCK_DRILLS: Drill[] = [
  {
    id: 'd1',
    type: 'Fire',
    plannedDate: nextMonth.toISOString().slice(0, 10),
    status: 'Planned',
    targetLocation: 'Merkez Bina',
  },
  {
    id: 'd2',
    type: 'Earthquake',
    plannedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: 'Completed',
    targetLocation: 'Tüm binalar',
    completionDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    durationMinutes: 8,
    participantsCount: 45,
    successRating: 5,
    notes: 'Tüm personel toplanma alanına 8 dakikada ulaştı. Eksik yok.',
    photos: [],
  },
  {
    id: 'd3',
    type: 'Evacuation',
    plannedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: 'Completed',
    targetLocation: 'Üretim hangarı',
    completionDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    durationMinutes: 12,
    participantsCount: 28,
    successRating: 3,
    notes: 'Kuzey çıkış kapısı sıkıştı, alternatif rota kullanıldı.',
    photos: [],
  },
];

interface DrillState {
  drills: Drill[];
  scheduleDrill: (data: Omit<Drill, 'id' | 'status'> & { status?: DrillStatus }) => Drill;
  completeDrill: (id: string, report: DrillReportData) => void;
  deleteDrill: (id: string) => void;
  getDrillById: (id: string) => Drill | undefined;
  loadData: (isDemo: boolean) => void;
}

export const useDrillStore = create<DrillState>()(
  persist(
    (set, get) => ({
      drills: MOCK_DRILLS,

      scheduleDrill: (data) => {
        const drill: Drill = {
          ...data,
          id: generateId(),
          status: data.status ?? 'Planned',
        };
        set((state) => ({ drills: [drill, ...state.drills] }));
        return drill;
      },

      completeDrill: (id, report) => {
        set((state) => ({
          drills: state.drills.map((d) =>
            d.id === id
              ? {
                  ...d,
                  status: 'Completed' as const,
                  completionDate: report.completionDate,
                  durationMinutes: report.durationMinutes,
                  participantsCount: report.participantsCount,
                  successRating: report.successRating,
                  notes: report.notes,
                  photos: report.photos,
                }
              : d
          ),
        }));
      },

      deleteDrill: (id) => {
        set((state) => ({ drills: state.drills.filter((d) => d.id !== id) }));
      },

      getDrillById: (id) => get().drills.find((d) => d.id === id),

      loadData: (isDemo) => {
        if (isDemo) {
          set({ drills: [...MOCK_DRILLS] });
        } else {
          set({ drills: [] });
        }
      },
    }),
    { name: 'ohs-drills', partialize: (s) => ({ drills: s.drills }) }
  )
);
