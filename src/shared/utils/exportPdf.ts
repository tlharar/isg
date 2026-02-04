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

/**
 * Generates a simple training certificate PDF and triggers download.
 * @param employeeName Display name of the participant
 * @param trainingTitle Title of the training/session
 * @param date Training date
 * @param durationHours Duration in hours
 */
export function createCertificatePdf(
  employeeName: string,
  trainingTitle: string,
  date: Date | string,
  durationHours: number
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const dateStr = typeof date === 'string' ? date : new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('EĞİTİM KATILIM SERTİFİKASI', 105, 30, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text('Bu belge aşağıda adı geçen kişinin ilgili eğitime katıldığını belirtir.', 105, 42, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(employeeName, 105, 65, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(trainingTitle, 105, 78, { align: 'center' });
  doc.text(`Tarih: ${dateStr}`, 105, 90, { align: 'center' });
  doc.text(`Süre: ${durationHours} saat`, 105, 100, { align: 'center' });

  const safeName = employeeName.replace(/\s+/g, '_').replace(/[^\w\u00C0-\u024F\-_]/g, '') || 'Sertifika';
  doc.save(`Sertifika_${safeName}.pdf`);
}
