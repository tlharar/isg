import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MarkerType =
  | 'fire_extinguisher'
  | 'fire_hose'
  | 'alarm_button'
  | 'emergency_exit'
  | 'first_aid'
  | 'electrical_panel'
  | 'assembly_point'
  | 'you_are_here';

export type MarkerSize = 'small' | 'medium' | 'large';

export interface FloorPlanMarker {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  type: MarkerType;
  rotation?: number; // degrees 0-360 (default 0)
  size?: MarkerSize; // default 'medium'
}

/** Alias for saved plan icons (same shape as canvas markers). */
export type PlanIcon = FloorPlanMarker;

export interface SavedPlan {
  id: string;
  companyId: string;
  companyName: string;
  name: string;
  date: string;
  backgroundImage: string | null;
  icons: PlanIcon[];
}

export interface FloorPlanState {
  imageDataUrl: string | null;
  markers: FloorPlanMarker[];
  savedPlans: SavedPlan[];
  setImage: (dataUrl: string | null) => void;
  addMarker: (x: number, y: number, type: MarkerType) => FloorPlanMarker;
  removeMarker: (id: string) => void;
  updateMarkerRotation: (id: string, rotation: number) => void;
  updateMarkerSize: (id: string, size: MarkerSize) => void;
  clearAll: () => void;
  savePlan: (plan: SavedPlan) => void;
  deletePlan: (id: string) => void;
  loadPlanToEditor: (plan: SavedPlan) => void;
}

function generateId(): string {
  return `marker-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function generatePlanId(): string {
  return `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useFloorPlanStore = create<FloorPlanState>()(
  persist(
    (set) => ({
      imageDataUrl: null,
      markers: [],
      savedPlans: [],

      setImage: (dataUrl) => {
        set({ imageDataUrl: dataUrl });
        if (!dataUrl) set({ markers: [] });
      },

      addMarker: (x, y, type) => {
        const marker: FloorPlanMarker = {
          id: generateId(),
          x: Math.max(0, Math.min(100, x)),
          y: Math.max(0, Math.min(100, y)),
          type,
          rotation: 0,
          size: 'medium',
        };
        set((state) => ({ markers: [...state.markers, marker] }));
        return marker;
      },

      removeMarker: (id) => {
        set((state) => ({ markers: state.markers.filter((m) => m.id !== id) }));
      },

      updateMarkerRotation: (id, rotation) => {
        const normalized = ((rotation % 360) + 360) % 360;
        set((state) => ({
          markers: state.markers.map((m) =>
            m.id === id ? { ...m, rotation: normalized } : m
          ),
        }));
      },

      updateMarkerSize: (id, size) => {
        set((state) => ({
          markers: state.markers.map((m) => (m.id === id ? { ...m, size } : m)),
        }));
      },

      clearAll: () => set({ imageDataUrl: null, markers: [] }),

      savePlan: (plan) => {
        set((state) => ({ savedPlans: [...state.savedPlans, plan] }));
      },

      deletePlan: (id) => {
        set((state) => ({
          savedPlans: state.savedPlans.filter((p) => p.id !== id),
        }));
      },

      loadPlanToEditor: (plan) => {
        set({
          imageDataUrl: plan.backgroundImage,
          markers: plan.icons ?? [],
        });
      },
    }),
    {
      name: 'ohs-floor-plan',
      partialize: (s) => ({
        imageDataUrl: s.imageDataUrl,
        markers: s.markers,
        savedPlans: s.savedPlans,
      }),
    }
  )
);
