import * as XLSX from 'xlsx';

/**
 * Exports table data to .xlsx format.
 * @param data Array of row objects
 * @param columns Keys to include (column order)
 * @param filename Without extension
 */
export function exportTableToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: (keyof T)[],
  filename: string
): void {
  const rows = data.map((row) => {
    const record: Record<string, unknown> = {};
    columns.forEach((key) => {
      record[String(key)] = row[key];
    });
    return record;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
