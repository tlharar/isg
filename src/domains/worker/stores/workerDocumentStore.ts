import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WorkerDocumentType =
  | 'MYK_CERTIFICATE'
  | 'OHS_TRAINING'
  | 'DRIVERS_LICENSE'
  | 'DIPLOMA'
  | 'SRC_CERTIFICATE'
  | 'FIRST_AID'
  | 'PPE_DELIVERY'
  | 'OTHER';

export type WorkerDocumentStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';

export interface WorkerDocument {
  id: string;
  workerId: string;
  type: WorkerDocumentType;
  title: string;
  fileUrl: string;
  uploadDate: Date;
  expiryDate: Date | null;
  documentNumber: string;
  status: WorkerDocumentStatus;
  fileName?: string;
  /** Optional notes (Not/Açıklama) - not used as main title */
  notes?: string;
}

const EXPIRING_DAYS_THRESHOLD = 60;

function parseDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Compute status from expiryDate and today.
 * EXPIRED if expiryDate is in the past.
 * EXPIRING_SOON if expiryDate is within the next 60 days.
 * VALID otherwise. If expiryDate is null, returns VALID.
 */
export function computeWorkerDocumentStatus(expiryDate: Date | null): WorkerDocumentStatus {
  if (expiryDate == null) return 'VALID';
  const end = parseDate(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  if (end < today) return 'EXPIRED';
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= EXPIRING_DAYS_THRESHOLD ? 'EXPIRING_SOON' : 'VALID';
}

/** Types that have an expiry date - show Geçerlilik Tarihi only for these. Diploma and Diğer do not. */
export const TYPES_WITH_EXPIRY: WorkerDocumentType[] = [
  'MYK_CERTIFICATE',
  'OHS_TRAINING',
  'DRIVERS_LICENSE',
  'SRC_CERTIFICATE',
  'FIRST_AID',
  'PPE_DELIVERY',
];

/** MYK certificate requires expiry date */
export const TYPE_REQUIRES_EXPIRY: WorkerDocumentType = 'MYK_CERTIFICATE';

interface WorkerDocumentState {
  /** All worker documents from all workers (global list). */
  documents: WorkerDocument[];
  addDocument: (doc: Omit<WorkerDocument, 'id' | 'status'>) => void;
  deleteDocument: (id: string) => void;
  getDocumentsByWorker: (workerId: string) => WorkerDocument[];
  /** Returns all documents across all workers. Resolve worker (e.g. jobTitle) via workerStore.getWorkerById(doc.workerId) when displaying. */
  getAllDocuments: () => WorkerDocument[];
  /** Count of documents with status EXPIRED across the entire company. */
  getExpiredDocumentsCount: () => number;
  /** Count of documents with status EXPIRING_SOON across the entire company. */
  getExpiringSoonDocumentsCount: () => number;
  checkDocumentExpirations: (workerId: string) => void;
  /** Recompute status for all documents (call when opening global list). */
  checkAllExpirations: () => void;
}

function generateId(): string {
  return `worker-doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useWorkerDocumentStore = create<WorkerDocumentState>()(
  persist(
    (set, get) => ({
      documents: [],

      addDocument: (doc) => {
        const id = generateId();
        const uploadDate = parseDate(doc.uploadDate);
        const expiryDate = doc.expiryDate ? parseDate(doc.expiryDate) : null;
        const status = computeWorkerDocumentStatus(expiryDate);
        const newDoc: WorkerDocument = {
          ...doc,
          id,
          uploadDate,
          expiryDate,
          status,
          documentNumber: doc.documentNumber ?? '',
        };
        set((state) => ({ documents: [...state.documents, newDoc] }));
      },

      deleteDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        }));
      },

      getDocumentsByWorker: (workerId) => {
        return get().documents.filter((d) => d.workerId === workerId);
      },

      getAllDocuments: () => get().documents,

      getExpiredDocumentsCount: () =>
        get().documents.filter((d) => d.status === 'EXPIRED').length,

      getExpiringSoonDocumentsCount: () =>
        get().documents.filter((d) => d.status === 'EXPIRING_SOON').length,

      checkDocumentExpirations: (workerId) => {
        set((state) => ({
          documents: state.documents.map((d) => {
            if (d.workerId !== workerId) return d;
            const uploadDate = parseDate(d.uploadDate);
            const expiryDate = d.expiryDate ? parseDate(d.expiryDate) : null;
            return {
              ...d,
              uploadDate,
              expiryDate,
              status: computeWorkerDocumentStatus(expiryDate),
            };
          }),
        }));
      },

      checkAllExpirations: () => {
        set((state) => ({
          documents: state.documents.map((d) => {
            const uploadDate = parseDate(d.uploadDate);
            const expiryDate = d.expiryDate ? parseDate(d.expiryDate) : null;
            return {
              ...d,
              uploadDate,
              expiryDate,
              status: computeWorkerDocumentStatus(expiryDate),
            };
          }),
        }));
      },
    }),
    {
      name: 'isg-worker-documents',
      partialize: (s) => ({ documents: s.documents }),
    }
  )
);

/** Turkish labels for document type dropdown and table */
export const WORKER_DOCUMENT_TYPE_LABELS: Record<WorkerDocumentType, string> = {
  MYK_CERTIFICATE: 'MYK / Mesleki Yeterlilik Belgesi',
  OHS_TRAINING: 'İSG Eğitimi',
  DRIVERS_LICENSE: 'Ehliyet',
  DIPLOMA: 'Diploma',
  SRC_CERTIFICATE: 'SRC Belgesi',
  FIRST_AID: 'İlk Yardım',
  PPE_DELIVERY: 'KKD Teslim Tutanağı',
  OTHER: 'Diğer',
};

export const WORKER_DOCUMENT_STATUS_LABELS: Record<WorkerDocumentStatus, string> = {
  VALID: 'Geçerli',
  EXPIRING_SOON: 'Yaklaşıyor',
  EXPIRED: 'Süresi Doldu',
};
