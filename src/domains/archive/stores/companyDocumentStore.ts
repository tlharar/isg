import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CompanyDocumentType =
  | 'TAX_PLATE'
  | 'SIGNATURE_CIRCULAR'
  | 'TRADE_REGISTRY'
  | 'ACTIVITY_CERTIFICATE'
  | 'OHS_CONTRACT'
  | 'SGK_CLEARANCE'
  | 'OTHER';

export type CompanyDocumentStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';

export interface CompanyDocument {
  id: string;
  companyId: string;
  companyName: string;
  type: CompanyDocumentType;
  title: string;
  fileUrl: string;
  uploadDate: Date;
  validUntilDate: Date | null;
  status: CompanyDocumentStatus;
  fileName?: string;
}

const EXPIRING_DAYS_THRESHOLD = 30;

function parseDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function computeCompanyDocumentStatus(validUntilDate: Date | null): CompanyDocumentStatus {
  if (validUntilDate == null) return 'VALID';
  const end = parseDate(validUntilDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  if (end < today) return 'EXPIRED';
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= EXPIRING_DAYS_THRESHOLD ? 'EXPIRING_SOON' : 'VALID';
}

/** Types that require a validity date in the form */
export const TYPES_REQUIRING_VALID_UNTIL: CompanyDocumentType[] = [
  'ACTIVITY_CERTIFICATE',
  'SIGNATURE_CIRCULAR',
  'TAX_PLATE',
];

interface CompanyDocumentState {
  documents: CompanyDocument[];
  uploadDocument: (doc: Omit<CompanyDocument, 'id' | 'status'>) => void;
  deleteDocument: (id: string) => void;
  getAllDocuments: () => CompanyDocument[];
  getExpiredCount: () => number;
  getExpiringSoonCount: () => number;
  checkExpirations: () => void;
}

function generateId(): string {
  return `company-doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useCompanyDocumentStore = create<CompanyDocumentState>()(
  persist(
    (set, get) => ({
      documents: [],

      uploadDocument: (doc) => {
        const id = generateId();
        const uploadDate = parseDate(doc.uploadDate);
        const validUntilDate = doc.validUntilDate ? parseDate(doc.validUntilDate) : null;
        const status = computeCompanyDocumentStatus(validUntilDate);
        const newDoc: CompanyDocument = {
          ...doc,
          id,
          uploadDate,
          validUntilDate,
          status,
        };
        set((state) => ({ documents: [...state.documents, newDoc] }));
      },

      deleteDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        }));
      },

      getAllDocuments: () => get().documents,

      getExpiredCount: () => get().documents.filter((d) => d.status === 'EXPIRED').length,

      getExpiringSoonCount: () => get().documents.filter((d) => d.status === 'EXPIRING_SOON').length,

      checkExpirations: () => {
        set((state) => ({
          documents: state.documents.map((d) => ({
            ...d,
            uploadDate: parseDate(d.uploadDate),
            validUntilDate: d.validUntilDate ? parseDate(d.validUntilDate) : null,
            status: computeCompanyDocumentStatus(d.validUntilDate ? parseDate(d.validUntilDate) : null),
          })),
        }));
      },
    }),
    {
      name: 'isg-archive-company-documents',
      partialize: (s) => ({ documents: s.documents }),
    }
  )
);

export const COMPANY_DOCUMENT_TYPE_LABELS: Record<CompanyDocumentType, string> = {
  TAX_PLATE: 'Vergi Levhası',
  SIGNATURE_CIRCULAR: 'İmza Sirküleri',
  TRADE_REGISTRY: 'Ticaret Sicil',
  ACTIVITY_CERTIFICATE: 'Faaliyet Belgesi',
  OHS_CONTRACT: 'İSG Sözleşmesi',
  SGK_CLEARANCE: 'SGK Borç Belgesi',
  OTHER: 'Diğer',
};

export const COMPANY_DOCUMENT_STATUS_LABELS: Record<CompanyDocumentStatus, string> = {
  VALID: 'Geçerli',
  EXPIRING_SOON: 'Süresi Yaklaşan',
  EXPIRED: 'Süresi Doldu',
};
