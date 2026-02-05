import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppointmentType =
  | 'PERIODIC_EXAM'
  | 'JOB_ENTRY'
  | 'POLYCLINIC'
  | 'VACCINATION'
  | 'OTHER';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface Appointment {
  id: string;
  workerId: string;
  doctorId: string;
  start: Date;
  end: Date;
  type: AppointmentType;
  status: AppointmentStatus;
  notes: string;
}

function generateId(): string {
  return `apt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toDate(d: Date | string): Date {
  if (d instanceof Date) return d;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

/** Returns true if [aStart, aEnd) overlaps with [bStart, bEnd). End is exclusive for same-slot logic. */
function timeRangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  const as = toDate(aStart).getTime();
  const ae = toDate(aEnd).getTime();
  const bs = toDate(bStart).getTime();
  const be = toDate(bEnd).getTime();
  return as < be && bs < ae;
}

export const DEFAULT_DURATION_MINUTES: Record<AppointmentType, number> = {
  PERIODIC_EXAM: 20,
  JOB_ENTRY: 30,
  POLYCLINIC: 10,
  VACCINATION: 15,
  OTHER: 15,
};

interface AppointmentState {
  appointments: Appointment[];
  addAppointment: (data: Omit<Appointment, 'id'>) => Appointment;
  updateAppointment: (id: string, data: Partial<Omit<Appointment, 'id'>>) => void;
  updateStatus: (id: string, status: AppointmentStatus) => void;
  deleteAppointment: (id: string) => void;
  getAppointmentById: (id: string) => Appointment | undefined;
  getAppointmentsByDateRange: (start: Date, end: Date) => Appointment[];
  /** Throws if the given slot overlaps another appointment for the same doctor (excluding optional excludeId). */
  checkConflict: (
    start: Date,
    end: Date,
    doctorId: string,
    excludeId?: string
  ) => void;
}

export class AppointmentConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppointmentConflictError';
  }
}

export const useAppointmentStore = create<AppointmentState>()(
  persist(
    (set, get) => ({
      appointments: [],

      addAppointment: (data) => {
        const start = toDate(data.start);
        const end = toDate(data.end);
        get().checkConflict(start, end, data.doctorId);
        const appointment: Appointment = {
          ...data,
          id: generateId(),
          start,
          end,
        };
        set((state) => ({ appointments: [appointment, ...state.appointments] }));
        return appointment;
      },

      updateAppointment: (id, data) => {
        const existing = get().getAppointmentById(id);
        if (!existing) return;
        const start = data.start !== undefined ? toDate(data.start) : existing.start;
        const end = data.end !== undefined ? toDate(data.end) : existing.end;
        const doctorId = data.doctorId !== undefined ? data.doctorId : existing.doctorId;
        get().checkConflict(start, end, doctorId, id);
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === id
              ? {
                  ...a,
                  ...data,
                  start: data.start ? toDate(data.start) : a.start,
                  end: data.end ? toDate(data.end) : a.end,
                }
              : a
          ),
        }));
      },

      updateStatus: (id, status) => {
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === id ? { ...a, status } : a
          ),
        }));
      },

      deleteAppointment: (id) => {
        set((state) => ({
          appointments: state.appointments.filter((a) => a.id !== id),
        }));
      },

      getAppointmentById: (id) => get().appointments.find((a) => a.id === id),

      getAppointmentsByDateRange: (start, end) => {
        const s = toDate(start).getTime();
        const e = toDate(end).getTime();
        return get().appointments.filter((a) => {
          const aStart = toDate(a.start).getTime();
          const aEnd = toDate(a.end).getTime();
          return aStart < e && aEnd > s;
        });
      },

      checkConflict: (start, end, doctorId, excludeId) => {
        const conflicting = get().appointments.find(
          (a) =>
            a.id !== excludeId &&
            a.doctorId === doctorId &&
            timeRangesOverlap(start, end, toDate(a.start), toDate(a.end))
        );
        if (conflicting) {
          throw new AppointmentConflictError(
            'Bu saat aralığı bu hekime ait başka bir randevu ile çakışıyor. Lütfen başka bir saat seçin.'
          );
        }
      },
    }),
    {
      name: 'ohs-appointments',
      partialize: (s) => ({ appointments: s.appointments }),
    }
  )
);
