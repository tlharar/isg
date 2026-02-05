import { useMedicalReportStore } from '@store/medicalReportStore';
import { useMemo } from 'react';

/**
 * Logical connection: reports are stored in medicalReportStore and filtered by patientId.
 * This module provides a selector / hook for patient-scoped reports.
 */

/** Get reports for a patient (for use outside React or in selectors). */
export function getReportsByPatientId(patientId: string) {
  return useMedicalReportStore.getState().getReportsByPatient(patientId);
}

/** Hook: returns reports for the given patientId, reactive to store updates. */
export function useReportsByPatient(patientId: string | undefined) {
  const getReportsByPatient = useMedicalReportStore((s) => s.getReportsByPatient);
  return useMemo(
    () => (patientId ? getReportsByPatient(patientId) : []),
    [getReportsByPatient, patientId]
  );
}
