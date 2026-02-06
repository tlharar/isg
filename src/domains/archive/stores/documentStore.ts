import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OHSDocumentCategory =
  | 'RISK_ASSESSMENT'
  | 'EMERGENCY_PLAN'
  | 'ANNUAL_REPORT'
  | 'BOARD_MEETING'
  | 'INSTRUCTION'
  | 'MSDS'
  | 'OTHER';

export type OHSDocumentStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';

export interface OHSDocument {
  id: string;
  title: string;
  category: OHSDocumentCategory;
  preparationDate: Date;
  validUntilDate: Date | null;
  fileUrl: string;
  uploadedBy: string;
  status: OHSDocumentStatus;
  revision: number;
  fileName?: string; // original file name for download
}

const EXPIRING_DAYS_THRESHOLD = 30;

function parseDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Compute status from validUntilDate and today.
 * EXPIRED if validUntilDate is in the past.
 * EXPIRING_SOON if validUntilDate is within the next 30 days.
 * VALID otherwise. If validUntilDate is null, returns VALID.
 */
export function computeDocumentStatus(validUntilDate: Date | null): OHSDocumentStatus {
  if (validUntilDate == null) return 'VALID';
  const end = parseDate(validUntilDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  if (end < today) return 'EXPIRED';
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= EXPIRING_DAYS_THRESHOLD ? 'EXPIRING_SOON' : 'VALID';
}

interface DocumentState {
  documents: OHSDocument[];
  uploadDocument: (doc: Omit<OHSDocument, 'id' | 'status'>) => void;
  deleteDocument: (id: string) => void;
  getDocumentsByCategory: (category: OHSDocumentCategory) => OHSDocument[];
  checkExpirations: () => void;
}

function generateId(): string {
  return `ohs-doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      documents: [],

      uploadDocument: (doc) => {
        const id = generateId();
        const prep = parseDate(doc.preparationDate);
        const validUntil = doc.validUntilDate ? parseDate(doc.validUntilDate) : null;
        const status = computeDocumentStatus(validUntil);
        const newDoc: OHSDocument = {
          ...doc,
          id,
          preparationDate: prep,
          validUntilDate: validUntil,
          status,
          revision: doc.revision ?? 1,
        };
        set((state) => ({ documents: [...state.documents, newDoc] }));
      },

      deleteDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        }));
      },

      getDocumentsByCategory: (category) => {
        return get().documents.filter((d) => d.category === category);
      },

      checkExpirations: () => {
        set((state) => ({
          documents: state.documents.map((d) => ({
            ...d,
            preparationDate: parseDate(d.preparationDate),
            validUntilDate: d.validUntilDate ? parseDate(d.validUntilDate) : null,
            status: computeDocumentStatus(d.validUntilDate ? parseDate(d.validUntilDate) : null),
          })),
        }));
      },
    }),
    {
      name: 'isg-archive-ohs-documents',
      partialize: (s) => ({ documents: s.documents }),
    }
  )
);

/** Turkish labels for category dropdown and table */
export const OHS_CATEGORY_LABELS: Record<OHSDocumentCategory, string> = {
  RISK_ASSESSMENT: 'Risk Değerlendirmesi',
  EMERGENCY_PLAN: 'Acil Durum Planı',
  ANNUAL_REPORT: 'Yıllık Rapor',
  BOARD_MEETING: 'Yönetim Kurulu Toplantı',
  INSTRUCTION: 'Talimat',
  MSDS: 'MSDS / Güvenlik Bilgi Formu',
  OTHER: 'Diğer',
};

export const OHS_STATUS_LABELS: Record<OHSDocumentStatus, string> = {
  VALID: 'Geçerli',
  EXPIRING_SOON: 'Süresi Yaklaşan',
  EXPIRED: 'Süresi Doldu',
};
