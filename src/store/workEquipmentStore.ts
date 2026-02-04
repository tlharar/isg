import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EquipmentType = 'Lifting' | 'Pressure' | 'Electrical' | 'Machine';
export type EquipmentStatus = 'Active' | 'Scrap' | 'Out of Service';
export type ControlResult = 'Pass' | 'Fail';

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  serialNumber: string;
  location: string;
  purchaseDate: string; // ISO date YYYY-MM-DD
  lastControlDate: string | null;
  nextControlDate: string | null;
  controlFrequencyMonths: number;
  status: EquipmentStatus;
}

export interface ControlRecord {
  id: string;
  equipmentId: string;
  date: string; // ISO date YYYY-MM-DD
  result: ControlResult;
  reportFile: string;
  performedBy: string;
}

function addMonths(isoDate: string, months: number): string {
  const d = new Date(isoDate + 'T12:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const today = () => new Date().toISOString().slice(0, 10);

interface WorkEquipmentState {
  equipment: Equipment[];
  controlRecords: ControlRecord[];
  addEquipment: (data: Omit<Equipment, 'id'>) => Equipment;
  updateEquipment: (id: string, data: Partial<Omit<Equipment, 'id'>>) => void;
  deleteEquipment: (id: string) => void;
  addControlRecord: (equipmentId: string, record: Omit<ControlRecord, 'id' | 'equipmentId'>) => ControlRecord;
  getEquipmentById: (id: string) => Equipment | undefined;
  getControlRecordsByEquipmentId: (equipmentId: string) => ControlRecord[];
  getUpcomingControls: () => Equipment[];
  loadData: (isDemo: boolean) => void;
}

const MOCK_EQUIPMENT: Equipment[] = [
  {
    id: 'weq-1',
    name: 'Forklift 3 Ton',
    type: 'Lifting',
    serialNumber: 'FL-2021-001',
    location: 'Depo B',
    purchaseDate: '2021-03-15',
    lastControlDate: '2024-08-10',
    nextControlDate: '2024-11-10', // overdue (before today)
    controlFrequencyMonths: 3,
    status: 'Active',
  },
  {
    id: 'weq-2',
    name: 'Hava Kompresörü',
    type: 'Pressure',
    serialNumber: 'HK-2022-002',
    location: 'Atölye A',
    purchaseDate: '2022-01-20',
    lastControlDate: '2025-01-05',
    nextControlDate: addDays(today(), 15), // 15 days from today -> upcoming (within 30)
    controlFrequencyMonths: 12,
    status: 'Active',
  },
  {
    id: 'weq-3',
    name: 'CNC Tezgah 1',
    type: 'Machine',
    serialNumber: 'CNC-2020-001',
    location: 'Üretim',
    purchaseDate: '2020-06-01',
    lastControlDate: '2025-01-15',
    nextControlDate: addMonths(today(), 90),
    controlFrequencyMonths: 12,
    status: 'Active',
  },
  {
    id: 'weq-4',
    name: 'Elektrik Panosu Ana',
    type: 'Electrical',
    serialNumber: 'EP-2019-001',
    location: 'Depo B',
    purchaseDate: '2019-11-10',
    lastControlDate: '2025-06-01',
    nextControlDate: addMonths(today(), 120),
    controlFrequencyMonths: 12,
    status: 'Active',
  },
];

const MOCK_CONTROLS: ControlRecord[] = [
  {
    id: 'ctrl-1',
    equipmentId: 'weq-1',
    date: '2024-08-10',
    result: 'Pass',
    reportFile: 'rapor-2024-08-fl.pdf',
    performedBy: 'XYZ Kontrol A.Ş.',
  },
  {
    id: 'ctrl-2',
    equipmentId: 'weq-2',
    date: '2025-01-05',
    result: 'Pass',
    reportFile: 'hava-kompresor-2025.pdf',
    performedBy: 'Basınçlı Kap Kontrol Ltd.',
  },
];

export function getControlStatus(equipment: Equipment): 'overdue' | 'upcoming' | 'safe' {
  const next = equipment.nextControlDate;
  if (!next) return 'safe';
  const todayStr = today();
  if (next < todayStr) return 'overdue';
  const d = new Date(next + 'T12:00:00');
  const d30 = new Date();
  d30.setDate(d30.getDate() + 30);
  const nextTime = d.getTime();
  const in30Time = d30.getTime();
  if (nextTime <= in30Time) return 'upcoming';
  return 'safe';
}

export const useWorkEquipmentStore = create<WorkEquipmentState>()(
  persist(
    (set, get) => ({
      equipment: MOCK_EQUIPMENT,
      controlRecords: MOCK_CONTROLS,

      addEquipment: (data) => {
        const eq: Equipment = {
          ...data,
          id: generateId('weq'),
        };
        set((s) => ({ equipment: [eq, ...s.equipment] }));
        return eq;
      },

      updateEquipment: (id, data) => {
        set((s) => ({
          equipment: s.equipment.map((e) => (e.id === id ? { ...e, ...data } : e)),
        }));
      },

      deleteEquipment: (id) => {
        set((s) => ({
          equipment: s.equipment.filter((e) => e.id !== id),
          controlRecords: s.controlRecords.filter((c) => c.equipmentId !== id),
        }));
      },

      addControlRecord: (equipmentId, record) => {
        const dateStr = typeof record.date === 'string' ? record.date : new Date(record.date).toISOString().slice(0, 10);
        const control: ControlRecord = {
          ...record,
          id: generateId('ctrl'),
          equipmentId,
          date: dateStr,
        };
        const equipment = get().equipment.find((e) => e.id === equipmentId);
        if (!equipment) {
          set((s) => ({ controlRecords: [control, ...s.controlRecords] }));
          return control;
        }
        const nextControlDate = addMonths(dateStr, equipment.controlFrequencyMonths);
        set((s) => ({
          controlRecords: [control, ...s.controlRecords],
          equipment: s.equipment.map((e) =>
            e.id === equipmentId
              ? { ...e, lastControlDate: dateStr, nextControlDate }
              : e
          ),
        }));
        return control;
      },

      getEquipmentById: (id) => get().equipment.find((e) => e.id === id),
      getControlRecordsByEquipmentId: (equipmentId) =>
        get()
          .controlRecords.filter((c) => c.equipmentId === equipmentId)
          .sort((a, b) => (b.date > a.date ? 1 : -1)),

      getUpcomingControls: () => {
        const d30 = new Date();
        d30.setDate(d30.getDate() + 30);
        const limitStr = d30.toISOString().slice(0, 10);
        return get().equipment.filter((e) => {
          if (e.status !== 'Active' || !e.nextControlDate) return false;
          return e.nextControlDate <= limitStr; // overdue or within 30 days
        });
      },

      loadData: (isDemo) => {
        if (isDemo) {
          set({ equipment: [...MOCK_EQUIPMENT], controlRecords: [...MOCK_CONTROLS] });
        } else {
          set({ equipment: [], controlRecords: [] });
        }
      },
    }),
    { name: 'ohs-work-equipment', partialize: (s) => ({ equipment: s.equipment, controlRecords: s.controlRecords }) }
  )
);
