import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PlanType = 'WORK' | 'TRAINING' | 'ASSESSMENT';

export type PlanItemStatus = 'Planned' | 'Completed';

export interface PlanItem {
  id: string;
  activity: string;
  responsible: string;
  months: number[];
  status: PlanItemStatus;
}

export interface PlanAttachment {
  id: string;
  name: string;
}

export interface AnnualPlan {
  id: string;
  companyId: string;
  /** Optional for backward compat; default WORK */
  type?: PlanType;
  year: number;
  creationDate: string;
  items: PlanItem[];
  attachments: PlanAttachment[];
}

/** Work plan (Yıllık Çalışma Planı) templates */
export const PLAN_TEMPLATES: string[] = [
  'Risk Analizi Yenileme',
  'Yangın Tatbikatı',
  'Periyodik Muayeneler',
  'KKD Kontrolü',
  'Kurul Toplantısı',
  'İş Sağlığı ve Güvenliği Eğitimleri',
  'Acil Durum Tatbikatı',
  'İlk Yardım Eğitimi',
  'Ortam Ölçümleri',
  'Sağlık Taramaları',
  'İSG İç Denetim',
  'Tehlike Bildirimi Değerlendirme',
  'Makine ve Ekipman Kontrolleri',
  'Kimyasal Madde Envanteri Güncelleme',
  'Çalışan Temsilcisi Seçimi',
];

/** Training plan (Yıllık Eğitim Planı) templates */
export const TRAINING_TEMPLATES: string[] = [
  'Temel İSG Eğitimi',
  'Yangın Eğitimi',
  'Yüksekte Çalışma Eğitimi',
  'Acil Durum Ekipleri Eğitimi',
  'Ergonomi Eğitimi',
];

/** Assessment plan (Yıllık Değerlendirme Planı) templates */
export const ASSESSMENT_TEMPLATES: string[] = [
  'Yıl Sonu Değerlendirme Raporu',
  'Kurul Yıllık Değerlendirmesi',
  'Ramak Kala Analiz Raporu',
];

export function getTemplatesForType(type: PlanType): string[] {
  switch (type) {
    case 'TRAINING':
      return TRAINING_TEMPLATES;
    case 'ASSESSMENT':
      return ASSESSMENT_TEMPLATES;
    default:
      return PLAN_TEMPLATES;
  }
}

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  WORK: 'Yıllık Çalışma Planı',
  TRAINING: 'Yıllık Eğitim Planı',
  ASSESSMENT: 'Yıllık Değerlendirme Planı',
};

export const RESPONSIBLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'İSG Uzmanı', label: 'İSG Uzmanı' },
  { value: 'İşyeri Hekimi', label: 'İşyeri Hekimi' },
  { value: 'İşveren', label: 'İşveren' },
];

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

function generateId(): string {
  return `plan-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Normalize URL planType to PlanType */
export function normalizePlanType(planType: string | undefined): PlanType {
  const t = (planType || '').toUpperCase();
  if (t === 'TRAINING' || t === 'ASSESSMENT') return t;
  return 'WORK';
}

interface PlanState {
  plans: AnnualPlan[];
  addPlan: (data: Omit<AnnualPlan, 'id' | 'creationDate'>) => AnnualPlan;
  updatePlan: (id: string, data: Partial<Omit<AnnualPlan, 'id'>>) => void;
  deletePlan: (id: string) => void;
  getPlanById: (id: string) => AnnualPlan | undefined;
  getPlansByCompany: (companyId: string) => AnnualPlan[];
  getPlansByCompanyAndType: (companyId: string, type: PlanType) => AnnualPlan[];
  getPlanByCompanyAndYear: (companyId: string, year: number) => AnnualPlan | undefined;
  getPlanByCompanyYearAndType: (companyId: string, year: number, type: PlanType) => AnnualPlan | undefined;
  /** Latest plan (by year) for a company and type; for summary status */
  getLatestPlanByCompanyAndType: (companyId: string, type: PlanType) => AnnualPlan | undefined;
  addAttachment: (planId: string, name: string) => void;
  removeAttachment: (planId: string, attachmentId: string) => void;
  loadData: (isDemo: boolean) => void;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      plans: [],

      addPlan: (data) => {
        const plan: AnnualPlan = {
          ...data,
          type: data.type ?? 'WORK',
          id: generateId(),
          creationDate: new Date().toISOString().slice(0, 10),
        };
        set((state) => ({ plans: [plan, ...state.plans] }));
        return plan;
      },

      updatePlan: (id, data) => {
        set((state) => ({
          plans: state.plans.map((p) => (p.id === id ? { ...p, ...data } : p)),
        }));
      },

      deletePlan: (id) => {
        set((state) => ({ plans: state.plans.filter((p) => p.id !== id) }));
      },

      getPlanById: (id) => get().plans.find((p) => p.id === id),

      getPlansByCompany: (companyId) =>
        get()
          .plans.filter((p) => p.companyId === companyId)
          .sort((a, b) => b.year - a.year),

      getPlansByCompanyAndType: (companyId, type) =>
        get()
          .plans.filter((p) => p.companyId === companyId && (p.type ?? 'WORK') === type)
          .sort((a, b) => b.year - a.year),

      getPlanByCompanyAndYear: (companyId, year) =>
        get().plans.find((p) => p.companyId === companyId && p.year === year),

      getPlanByCompanyYearAndType: (companyId, year, type) =>
        get().plans.find(
          (p) => p.companyId === companyId && p.year === year && (p.type ?? 'WORK') === type
        ),

      getLatestPlanByCompanyAndType: (companyId, type) => {
        const list = get().getPlansByCompanyAndType(companyId, type);
        return list[0] ?? undefined;
      },

      addAttachment: (planId, name) => {
        const att: PlanAttachment = { id: generateId(), name };
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === planId ? { ...p, attachments: [...p.attachments, att] } : p
          ),
        }));
      },

      removeAttachment: (planId, attachmentId) => {
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === planId
              ? { ...p, attachments: p.attachments.filter((a) => a.id !== attachmentId) }
              : p
          ),
        }));
      },

      loadData: (isDemo) => {
        if (!isDemo) set({ plans: [] });
      },
    }),
    { name: 'ohs-plans', partialize: (s) => ({ plans: s.plans }) }
  )
);

export { MONTHS };
