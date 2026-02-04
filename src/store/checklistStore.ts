import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChecklistItem {
  id: string;
  text: string;
}

export interface ChecklistTemplate {
  id: string;
  title: string;
  category: string;
  items: ChecklistItem[];
  createdAt: string; // ISO date string
}

function generateId(): string {
  return `cl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateItemId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const MOCK_TEMPLATES: ChecklistTemplate[] = [
  {
    id: 'tpl-1',
    title: 'Genel Saha Denetimi',
    category: 'Genel',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      { id: 'i1', text: 'Yangın tüpleri dolu ve erişilebilir mi?' },
      { id: 'i2', text: 'Acil çıkış yolları işaretli ve engelsiz mi?' },
      { id: 'i3', text: 'İlk yardım dolabı tam ve güncel mi?' },
      { id: 'i4', text: 'Çalışanlar KKD kullanıyor mu?' },
      { id: 'i5', text: 'Atık alanları düzenli ve işaretli mi?' },
    ],
  },
  {
    id: 'tpl-2',
    title: 'Yangın Tüpü Kontrolü',
    category: 'Yangın',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      { id: 'i6', text: 'Tüp doluluk basıncı yeşil bölgede mi?' },
      { id: 'i7', text: 'Etiket ve son kontrol tarihi okunaklı mı?' },
      { id: 'i8', text: 'Pim ve mühür sağlam mı?' },
      { id: 'i9', text: 'Tüp erişilebilir ve engelsiz mi?' },
      { id: 'i10', text: 'Kullanım talimatı asılı mı?' },
    ],
  },
  {
    id: 'tpl-3',
    title: 'Elektrik Pano Kontrol Listesi',
    category: 'Elektrik',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      { id: 'i11', text: 'Pano kapağı kapalı ve kilitli mi?' },
      { id: 'i12', text: 'Uyarı ve işaret levhaları mevcut mu?' },
      { id: 'i13', text: 'Topraklama bağlantıları kontrol edildi mi?' },
      { id: 'i14', text: 'Kablo girişleri sızdırmaz mı?' },
      { id: 'i15', text: 'Acill stop butonları erişilebilir ve çalışır mı?' },
      { id: 'i16', text: 'Sigorta ve devre kesiciler uygun mu?' },
    ],
  },
  {
    id: 'tpl-4',
    title: 'İlk Yardım ve Acil Müdahale',
    category: 'İlk Yardım',
    createdAt: new Date().toISOString(),
    items: [
      { id: 'i17', text: 'İlk yardım dolabı tam ve güncel mi?' },
      { id: 'i18', text: 'İlk yardımcı sayısı yönetmeliğe uygun mu?' },
      { id: 'i19', text: 'Acil numaralar görünür mü?' },
      { id: 'i20', text: 'Taşıma yöntemi (sedye vb.) mevcut mu?' },
    ],
  },
];

export const CHECKLIST_CATEGORIES = ['Genel', 'Yangın', 'Elektrik', 'İlk Yardım', 'KKD', 'Yüksekte Çalışma'] as const;

interface ChecklistState {
  templates: ChecklistTemplate[];
  addTemplate: (data: Omit<ChecklistTemplate, 'id' | 'createdAt'>) => ChecklistTemplate;
  updateTemplate: (id: string, data: Partial<Omit<ChecklistTemplate, 'id' | 'createdAt'>>) => void;
  deleteTemplate: (id: string) => void;
  getTemplateById: (id: string) => ChecklistTemplate | undefined;
  loadData: (isDemo: boolean) => void;
}

export const useChecklistStore = create<ChecklistState>()(
  persist(
    (set, get) => ({
      templates: MOCK_TEMPLATES,

      addTemplate: (data) => {
        const template: ChecklistTemplate = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ templates: [template, ...state.templates] }));
        return template;
      },

      updateTemplate: (id, data) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }));
      },

      getTemplateById: (id) => get().templates.find((t) => t.id === id),

      loadData: (isDemo) => {
        if (isDemo) {
          set({ templates: [...MOCK_TEMPLATES] });
        } else {
          set({ templates: [] });
        }
      },
    }),
    { name: 'ohs-checklists', partialize: (s) => ({ templates: s.templates }) }
  )
);

export { generateItemId };
