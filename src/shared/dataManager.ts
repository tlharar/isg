import type { UserRole } from '@shared/stores/authStore';
import { useBoardStore } from '@store/boardStore';
import { useChecklistStore } from '@store/checklistStore';
import { useCompanyStore } from '@store/companyStore';
import { useDofStore } from '@store/dofStore';
import { useDrillStore } from '@store/drillStore';
import { useEducationStore } from '@store/educationStore';
import { useEmergencyPlanStore } from '@store/emergencyPlanStore';
import { useEquipmentStore } from '@store/equipmentStore';
import { useIncidentStore } from '@store/incidentStore';
import { useInspectionStore } from '@store/inspectionStore';
import { usePlanStore } from '@store/planStore';
import { usePpeStore } from '@store/ppeStore';
import { usePpeRequestStore } from '@store/ppeRequestStore';
import { useRiskStore } from '@store/riskStore';
import { useSubContractorStore } from '@store/subContractorStore';
import { useWorkerStore } from '@store/workerStore';
import { useWorkEquipmentStore } from '@store/workEquipmentStore';

type StoreWithLoadData = {
  loadData: (isDemo: boolean) => void;
};

/**
 * Demo/Admin see mock data; standard users (Hekim, IsgUzman, GenelKullanici) see empty data.
 */
function isDemo(role: UserRole): boolean {
  return role.startsWith('Demo') || role === 'Admin';
}

/**
 * Initialize app data based on user role (strict data isolation).
 * - Demo users or Admin: load mock/dummy data.
 * - Standard users (Hekim, IsgUzman, GenelKullanici): clear data (empty system).
 * Call this immediately after successful login (e.g. in LoginPage).
 */
export function initializeUserData(role: UserRole): void {
  const isDemoUser = isDemo(role);

  const stores: StoreWithLoadData[] = [
    useBoardStore.getState(),
    useChecklistStore.getState(),
    useCompanyStore.getState(),
    useDofStore.getState(),
    useDrillStore.getState(),
    useEducationStore.getState(),
    useEmergencyPlanStore.getState(),
    useEquipmentStore.getState(),
    useIncidentStore.getState(),
    useInspectionStore.getState(),
    usePlanStore.getState(),
    usePpeStore.getState(),
    usePpeRequestStore.getState(),
    useRiskStore.getState(),
    useSubContractorStore.getState(),
    useWorkerStore.getState(),
    useWorkEquipmentStore.getState(),
  ];

  stores.forEach((store) => {
    try {
      if (typeof store.loadData === 'function') {
        store.loadData(isDemoUser);
      }
    } catch (e) {
      console.warn('dataManager: failed to load data for store', e);
    }
  });
}
