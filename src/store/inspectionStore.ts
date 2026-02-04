import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type InspectionItemStatus = 'Pending' | 'Compliant' | 'NonCompliant' | 'NA';

export interface InspectionItem {
  id: string;
  question: string;
  status: InspectionItemStatus;
  note?: string;
  /** Stored as string (e.g. file name) for persistence; File is kept in UI state during conduct. */
  photoUrl: string | null;
}

export interface Inspection {
  id: string;
  companyId: string;
  date: string; // ISO date string
  auditor: string;
  templateName: string;
  items: InspectionItem[];
  score: number; // 0-100
  completed: boolean;
}

export interface InspectionTemplate {
  key: string;
  name: string;
  category: string;
  questions: string[];
}

/** Score = (Compliant / (Total - NA)) * 100. Returns 0-100, or 100 when no items count. */
export function computeInspectionScore(items: InspectionItem[]): number {
  const total = items.length;
  if (total === 0) return 100;
  const naCount = items.filter((i) => i.status === 'NA').length;
  const scoredCount = total - naCount;
  if (scoredCount <= 0) return 100;
  const compliantCount = items.filter((i) => i.status === 'Compliant').length;
  return Math.round((compliantCount / scoredCount) * 100);
}

export const INSPECTION_TEMPLATES: InspectionTemplate[] = [
  {
    key: 'genel-saha',
    name: 'Genel Saha',
    category: 'Genel Saha',
    questions: [
      'Yangın tüpleri dolu ve erişilebilir mi?',
      'Acil çıkış yolları işaretli ve engelsiz mi?',
      'İlk yardım dolabı tam ve güncel mi?',
      'Çalışanlar KKD kullanıyor mu?',
      'Atık alanları düzenli ve işaretli mi?',
      'Zemin kayma ve düşme riski açısından uygun mu?',
    ],
  },
  {
    key: 'elektrik',
    name: 'Elektrik',
    category: 'Elektrik',
    questions: [
      'Elektrik panoları kilitli ve işaretli mi?',
      'Kablo ve prizler hasarsız mı?',
      'Topraklama kontrolleri yapılmış mı?',
      'Açıkta kablo ve geçici tesisat var mı?',
      'Elektrik işleri yetkili personel tarafından mı yapılıyor?',
      'Acil stop butonları erişilebilir ve çalışır mı?',
    ],
  },
  {
    key: 'yuksekte-calisma',
    name: 'Yüksekte Çalışma',
    category: 'Yüksekte Çalışma',
    questions: [
      'Merdiven ve platformlar sağlam ve uygun mu?',
      'Düşme önleyici sistem (kemer, life line) kullanılıyor mu?',
      'Çalışma alanı sınırları işaretlenmiş mi?',
      'Rüzgar ve hava koşulları değerlendirildi mi?',
      'Yüksekte çalışma eğitimi almış personel mi çalışıyor?',
      'Tüm aletler güvenli taşınıyor mu (düşme önlemleri)?',
    ],
  },
];

function generateId(): string {
  return `ins-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateItemId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface InspectionState {
  inspections: Inspection[];
  startInspection: (companyId: string, auditor: string, templateKey: string) => Inspection;
  updateItemStatus: (
    inspectionId: string,
    itemId: string,
    status: InspectionItemStatus,
    note?: string,
    photoUrl?: string | null
  ) => void;
  completeInspection: (id: string) => void;
  getInspectionById: (id: string) => Inspection | undefined;
  getTemplateByKey: (key: string) => InspectionTemplate | undefined;
  loadData: (isDemo: boolean) => void;
}

export const useInspectionStore = create<InspectionState>()(
  persist(
    (set, get) => ({
      inspections: [],

      startInspection: (companyId, auditor, templateKey) => {
        const template = INSPECTION_TEMPLATES.find((t) => t.key === templateKey);
        if (!template) throw new Error(`Template not found: ${templateKey}`);
        const items: InspectionItem[] = template.questions.map((q) => ({
          id: generateItemId(),
          question: q,
          status: 'Pending' as const,
          photoUrl: null,
        }));
        const inspection: Inspection = {
          id: generateId(),
          companyId,
          date: new Date().toISOString().slice(0, 10),
          auditor,
          templateName: template.name,
          items,
          score: 0,
          completed: false,
        };
        set((state) => ({ inspections: [inspection, ...state.inspections] }));
        return inspection;
      },

      updateItemStatus: (inspectionId, itemId, status, note, photoUrl) => {
        set((state) => ({
          inspections: state.inspections.map((ins) => {
            if (ins.id !== inspectionId) return ins;
            const items = ins.items.map((it) =>
              it.id === itemId
                ? {
                    ...it,
                    status,
                    ...(note !== undefined && { note }),
                    ...(photoUrl !== undefined && { photoUrl: photoUrl ?? null }),
                  }
                : it
            );
            const score = computeInspectionScore(items);
            return { ...ins, items, score };
          }),
        }));
      },

      completeInspection: (id) => {
        set((state) => ({
          inspections: state.inspections.map((ins) => {
            if (ins.id !== id) return ins;
            const score = computeInspectionScore(ins.items);
            return { ...ins, completed: true, score };
          }),
        }));
      },

      getInspectionById: (id) => get().inspections.find((i) => i.id === id),
      getTemplateByKey: (key) => INSPECTION_TEMPLATES.find((t) => t.key === key),

      loadData: (isDemo) => {
        set({ inspections: [] });
      },
    }),
    { name: 'ohs-inspections', partialize: (s) => ({ inspections: s.inspections }) }
  )
);
