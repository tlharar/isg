import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NonConformityRiskLevel = 'Critical' | 'Major' | 'Minor';

export type NonConformityStatus = 'Open' | 'Closed' | 'ConvertedToDOF';

export interface NonConformity {
  id: string;
  source: string;
  description: string;
  location: string;
  riskLevel: NonConformityRiskLevel;
  status: NonConformityStatus;
  detectedDate: string; // ISO date string
  evidencePhoto: string; // URL or Base64 placeholder
  /** Filled when closed via quickClose */
  closeNote?: string;
}

function generateId(): string {
  return `nc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Placeholder image for evidence (data URL or external placeholder) */
const PLACEHOLDER_PHOTO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120"><rect fill="#e9ecef" width="200" height="120"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#868e96" font-size="12" font-family="sans-serif">Kanıt fotoğrafı</text></svg>'
  );

const MOCK_ITEMS: NonConformity[] = [
  {
    id: 'nc-1',
    source: 'Saha Denetimi #105',
    description: 'Yangın tüpü doluluk tarihi geçmiş, etiket okunamıyor. Acil yenileme gerekli.',
    location: 'Depo A Girişi',
    riskLevel: 'Critical',
    status: 'Open',
    detectedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    evidencePhoto: PLACEHOLDER_PHOTO,
  },
  {
    id: 'nc-2',
    source: 'Çalışan Bildirimi',
    description: 'Acil çıkış kapısı önünde malzeme birikimi, kaçış yolu kısmen kapalı.',
    location: 'Üretim Bölümü - Kuzey Çıkış',
    riskLevel: 'Critical',
    status: 'Open',
    detectedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    evidencePhoto: PLACEHOLDER_PHOTO,
  },
  {
    id: 'nc-3',
    source: 'Saha Denetimi #104',
    description: 'Elektrik panosu kapağı açık bırakılmış, etiket eksik.',
    location: 'Ofis Katı Koridor',
    riskLevel: 'Major',
    status: 'Open',
    detectedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    evidencePhoto: PLACEHOLDER_PHOTO,
  },
  {
    id: 'nc-4',
    source: 'Çalışan Bildirimi',
    description: 'Zemin kayganlık uyarı levhası eksik (temizlik sonrası).',
    location: 'Yemekhane Girişi',
    riskLevel: 'Minor',
    status: 'Open',
    detectedDate: new Date().toISOString().slice(0, 10),
    evidencePhoto: PLACEHOLDER_PHOTO,
  },
  {
    id: 'nc-5',
    source: 'Saha Denetimi #103',
    description: 'KKD kullanımı uygun değil: 2 personel baret takmıyor.',
    location: 'Şantiye Alanı',
    riskLevel: 'Major',
    status: 'Closed',
    detectedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    evidencePhoto: PLACEHOLDER_PHOTO,
    closeNote: 'İlgili personele uyarı yapıldı, baret dağıtıldı.',
  },
  {
    id: 'nc-6',
    source: 'Çalışan Bildirimi',
    description: 'Açıkta kablo geçişi, takılma riski.',
    location: 'Atölye 2',
    riskLevel: 'Minor',
    status: 'ConvertedToDOF',
    detectedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    evidencePhoto: PLACEHOLDER_PHOTO,
  },
];

interface NonConformityState {
  items: NonConformity[];
  addIssue: (data: Omit<NonConformity, 'id'>) => NonConformity;
  quickClose: (id: string, note: string) => void;
  markAsConverted: (id: string) => void;
  getById: (id: string) => NonConformity | undefined;
}

export const useNonConformityStore = create<NonConformityState>()(
  persist(
    (set, get) => ({
      items: MOCK_ITEMS,

      addIssue: (data) => {
        const item: NonConformity = {
          ...data,
          id: generateId(),
        };
        set((state) => ({ items: [item, ...state.items] }));
        return item;
      },

      quickClose: (id, note) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, status: 'Closed' as const, closeNote: note } : i
          ),
        }));
      },

      markAsConverted: (id) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, status: 'ConvertedToDOF' as const } : i
          ),
        }));
      },

      getById: (id) => get().items.find((i) => i.id === id),
    }),
    { name: 'ohs-nonconformities', partialize: (s) => ({ items: s.items }) }
  )
);
