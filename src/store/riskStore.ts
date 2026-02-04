import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RiskItem {
  id: string;
  activity: string; // Yapılan İş / Faaliyet
  hazard: string; // Tehlike Kaynağı
  risk: string; // Risk / Sonuç
  probability: number; // 1-5 scale (Olasılık)
  severity: number; // 1-5 scale (Şiddet)
  riskScore: number; // Calculated: probability * severity
  riskLevel: 'Düşük' | 'Orta' | 'Yüksek' | 'Çok Yüksek'; // Calculated based on score
  controlMeasures: string; // Alınacak Önlemler
  responsiblePerson: string; // Sorumlu Kişi
  deadline: Date; // Termin Tarihi
  status: 'Open' | 'Closed';
  createdAt: Date;
  updatedAt: Date;
}

interface RiskState {
  risks: RiskItem[];
  addRisk: (risk: Omit<RiskItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRisk: (id: string, risk: Partial<Omit<RiskItem, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteRisk: (id: string) => void;
  getRiskById: (id: string) => RiskItem | undefined;
  loadData: (isDemo: boolean) => void;
}

/**
 * Calculate risk level based on risk score (P * S)
 * 1-6: Düşük (Low)
 * 8-12: Orta (Medium)
 * 15-20: Yüksek (High)
 * 25: Çok Yüksek (Very High)
 */
export function calculateRiskLevel(score: number): RiskItem['riskLevel'] {
  if (score <= 6) return 'Düşük';
  if (score <= 12) return 'Orta';
  if (score <= 20) return 'Yüksek';
  return 'Çok Yüksek';
}

/**
 * Calculate risk score and level
 */
export function calculateRisk(probability: number, severity: number) {
  const riskScore = probability * severity;
  const riskLevel = calculateRiskLevel(riskScore);
  return { riskScore, riskLevel };
}

export const useRiskStore = create<RiskState>()(
  persist(
    (set, get) => ({
      risks: [],
      addRisk: (risk) => {
        const now = new Date();
        const { riskScore, riskLevel } = calculateRisk(risk.probability, risk.severity);
        const newRisk: RiskItem = {
          ...risk,
          id: `risk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          riskScore,
          riskLevel,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ risks: [...state.risks, newRisk] }));
      },
      updateRisk: (id, updates) => {
        set((state) => ({
          risks: state.risks.map((risk) => {
            if (risk.id !== id) return risk;
            const updatedRisk = { ...risk, ...updates, updatedAt: new Date() };
            // Recalculate risk score and level if probability or severity changed
            if (updates.probability !== undefined || updates.severity !== undefined) {
              const { riskScore, riskLevel } = calculateRisk(
                updatedRisk.probability,
                updatedRisk.severity
              );
              updatedRisk.riskScore = riskScore;
              updatedRisk.riskLevel = riskLevel;
            }
            return updatedRisk;
          }),
        }));
      },
      deleteRisk: (id) => {
        set((state) => ({ risks: state.risks.filter((risk) => risk.id !== id) }));
      },
      getRiskById: (id) => {
        return get().risks.find((risk) => risk.id === id);
      },

      loadData: (isDemo) => {
        if (!isDemo) set({ risks: [] });
      },
    }),
    {
      name: 'ohs-risk-store',
    }
  )
);
