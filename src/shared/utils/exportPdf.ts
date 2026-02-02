import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PdfColumn {
  header: string;
  dataKey: string;
}

/**
 * Exports table data to PDF and optionally triggers print.
 * @param data Array of row objects
 * @param columns Column definitions (header label, data key)
 * @param title Document title
 * @param print If true, opens print dialog after generation
 */
export function exportTableToPdf<T extends Record<string, unknown>>(
  data: T[],
  columns: PdfColumn[],
  title: string,
  print = false
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFontSize(16);
  doc.text(title, 14, 20);

  const body = data.map((row) =>
    columns.map((col) => String(row[col.dataKey] ?? ''))
  );
  const headers = columns.map((c) => c.header);

  autoTable(doc, {
    head: [headers],
    body,
    startY: 28,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 66, 66] },
  });

  if (print) {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(`${title.replace(/\s+/g, '-')}.pdf`);
  }
}

/**
 * Generates a simple report PDF with title and optional paragraphs.
 */
export function createReportPdf(
  title: string,
  sections: { heading: string; content: string }[],
  filename: string,
  print = false
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 20;

  doc.setFontSize(18);
  doc.text(title, 14, y);
  y += 12;

  sections.forEach(({ heading, content }) => {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(heading, 14, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(content, 180);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 8;
  });

  if (print) {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(`${filename}.pdf`);
  }
}
