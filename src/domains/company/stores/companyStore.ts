/**
 * Company selection hierarchy (Ana Firma + Alt İşveren).
 * Selection state lives in appStore; company data in @store/companyStore.
 * This module exposes getters and actions for the dual-step company select UI.
 */
import { useMemo } from 'react';
import { useAppStore } from '@shared/stores/appStore';
import {
  useCompanyStore,
  type Company,
} from '@store/companyStore';

/** Main companies only (parentId null). Use for the main dropdown. */
export function useMainCompanies(): Company[] {
  const getMainCompanies = useCompanyStore((s) => s.getMainCompanies);
  return useMemo(() => getMainCompanies(), [getMainCompanies]);
}

/** Sub-contractors of the currently selected main company. Empty if no main selected. */
export function useSubContractors(): Company[] {
  const selectedMainCompanyId = useAppStore((s) => s.selectedMainCompanyId);
  const getSubContractorCompanies = useCompanyStore((s) => s.getSubContractorCompanies);
  return useMemo(
    () => (selectedMainCompanyId ? getSubContractorCompanies(selectedMainCompanyId) : []),
    [selectedMainCompanyId, getSubContractorCompanies]
  );
}

export function useSelectedMainCompanyId(): string | null {
  return useAppStore((s) => s.selectedMainCompanyId);
}

export function useSelectedSubCompanyId(): string | null {
  return useAppStore((s) => s.selectedSubCompanyId);
}

export function useSetSelectedMainCompany() {
  return useAppStore((s) => s.setSelectedMainCompany);
}

export function useSetSelectedSubCompany() {
  return useAppStore((s) => s.setSelectedSubCompany);
}
