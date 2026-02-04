import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PpeRequestUrgency = 'Normal' | 'High';

export type PpeRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Completed';

export interface PpeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  equipmentName: string;
  quantity: number;
  requestDate: string; // ISO date string
  urgency: PpeRequestUrgency;
  status: PpeRequestStatus;
  description: string;
}

function generateId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const MOCK_REQUESTS: PpeRequest[] = [
  {
    id: 'req-1',
    employeeId: '1',
    employeeName: 'Ahmet Yılmaz',
    equipmentName: 'İş Ayakkabısı (S3)',
    quantity: 1,
    requestDate: new Date().toISOString().slice(0, 10),
    urgency: 'High',
    status: 'Pending',
    description: 'Eskisi yırtıldı, acil ihtiyaç.',
  },
  {
    id: 'req-2',
    employeeId: '2',
    employeeName: 'Ayşe Demir',
    equipmentName: 'Baret (EN 397)',
    quantity: 1,
    requestDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    urgency: 'Normal',
    status: 'Approved',
    description: 'Yeni işe başlama.',
  },
  {
    id: 'req-3',
    employeeId: '1',
    employeeName: 'Ahmet Yılmaz',
    equipmentName: 'İş Eldiveni',
    quantity: 2,
    requestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    urgency: 'Normal',
    status: 'Completed',
    description: 'Stok yenileme.',
  },
  {
    id: 'req-4',
    employeeId: '2',
    employeeName: 'Ayşe Demir',
    equipmentName: 'Toz Maskesi (FFP2)',
    quantity: 10,
    requestDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    urgency: 'High',
    status: 'Pending',
    description: 'Tozlu ortamda çalışma.',
  },
];

interface PpeRequestState {
  requests: PpeRequest[];
  addRequest: (data: Omit<PpeRequest, 'id'>) => PpeRequest;
  updateStatus: (id: string, newStatus: PpeRequestStatus) => void;
  deleteRequest: (id: string) => void;
  loadData: (isDemo: boolean) => void;
}

export const usePpeRequestStore = create<PpeRequestState>()(
  persist(
    (set) => ({
      requests: MOCK_REQUESTS,

      addRequest: (data) => {
        const request: PpeRequest = {
          ...data,
          id: generateId(),
        };
        set((state) => ({ requests: [request, ...state.requests] }));
        return request;
      },

      updateStatus: (id, newStatus) => {
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === id ? { ...r, status: newStatus } : r
          ),
        }));
      },

      deleteRequest: (id) => {
        set((state) => ({ requests: state.requests.filter((r) => r.id !== id) }));
      },

      loadData: (isDemo) => {
        if (isDemo) set({ requests: [...MOCK_REQUESTS] });
        else set({ requests: [] });
      },
    }),
    { name: 'ohs-ppe-requests', partialize: (s) => ({ requests: s.requests }) }
  )
);
