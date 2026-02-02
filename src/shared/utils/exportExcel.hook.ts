import { useCallback } from 'react';
import { exportTableToExcel as exportToExcel } from './exportExcel';

export type ExportTableToExcelFn = <T extends Record<string, unknown>>(
  data: T[],
  columns: (keyof T)[],
  filename: string
) => void;

export function useExportExcel() {
  const exportTableToExcel = useCallback(
    (<T extends Record<string, unknown>>(
      data: T[],
      columns: (keyof T)[],
      filename: string
    ) => {
      exportToExcel(data, columns, filename);
    }) as ExportTableToExcelFn,
    []
  );

  return { exportTableToExcel };
}
