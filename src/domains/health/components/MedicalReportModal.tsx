import { useEffect, useMemo } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  Button,
  Group,
  Checkbox,
  Paper,
  Text,
  Divider,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useAuthStore } from '@shared/stores/authStore';
import { usePrescriptionStore } from '@store/prescriptionStore';
import { useMedicalReportStore, type MedicalReport } from '@store/medicalReportStore';
import dayjs from 'dayjs';

export interface MedicalReportModalInitial {
  patientId: string;
  patientName: string;
  tcNo: string;
  diagnosis?: string;
  prescriptionId?: string;
}

interface MedicalReportModalProps {
  opened: boolean;
  onClose: () => void;
  initial?: MedicalReportModalInitial | null;
  /** When provided, modal opens in view-only mode (readonly + Yazdır button). */
  report?: MedicalReport | null;
  /** Explicit view mode: show readonly form and only Print button. */
  viewMode?: boolean;
  /** After save, optionally open print for the created report */
  printAfterSave?: boolean;
}

function daysBetween(start: Date, end: Date): number {
  const s = dayjs(start).startOf('day');
  const e = dayjs(end).startOf('day');
  if (e.isBefore(s)) return 0;
  return e.diff(s, 'day') + 1;
}

function addDays(d: Date, days: number): Date {
  return dayjs(d).add(days, 'day').toDate();
}

function formatDateTR(d: Date): string {
  return dayjs(d).format('DD.MM.YYYY');
}

/** Generate printable HTML for the medical report */
function getReportPrintHtml(report: MedicalReport, doctorName: string): string {
  const style = `
    body { font-family: 'Times New Roman', serif; font-size: 12pt; padding: 24px; max-width: 700px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 24px; border-bottom: 1px solid #333; padding-bottom: 12px; }
    .header h1 { font-size: 16pt; margin: 0 0 8px 0; }
    .section { margin: 16px 0; }
    .section-title { font-weight: bold; margin-bottom: 6px; }
    .row { display: flex; margin: 4px 0; }
    .label { width: 180px; flex-shrink: 0; }
    .value { flex: 1; }
    .footer { margin-top: 32px; text-align: right; }
    .signature { margin-top: 48px; }
    @media print { body { padding: 16px; } }
  `;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>İstirahat Raporu</title><style>${style}</style></head>
<body>
  <div class="header">
    <h1>İSTİRAHAT RAPORU</h1>
    <p style="margin:0; font-size: 11pt; color: #555;">Medical Report / Sick Leave</p>
  </div>
  <div class="section">
    <div class="section-title">Hasta Bilgileri</div>
    <div class="row"><span class="label">Adı Soyadı:</span><span class="value">${report.patientName}</span></div>
    <div class="row"><span class="label">TC Kimlik No:</span><span class="value">${report.tcNo || '—'}</span></div>
  </div>
  <div class="section">
    <div class="section-title">Rapor Bilgileri</div>
    <div class="row"><span class="label">İstirahat Başlangıç:</span><span class="value">${formatDateTR(report.startDate)}</span></div>
    <div class="row"><span class="label">İstirahat Bitiş:</span><span class="value">${formatDateTR(report.endDate)}</span></div>
    <div class="row"><span class="label">Süre:</span><span class="value">${report.days} Gün</span></div>
    <div class="row"><span class="label">İşe Başlama Tarihi:</span><span class="value">${formatDateTR(report.returnToWorkDate)}</span></div>
  </div>
  <div class="section">
    <div class="section-title">Tanı</div>
    <p>${report.diagnosis || '—'}</p>
  </div>
  ${report.description ? `
  <div class="section">
    <div class="section-title">Açıklama / Karar</div>
    <p>${report.description}</p>
  </div>
  ` : ''}
  ${report.checkupRequired ? '<div class="section"><p><strong>Kontrol muayenesi gereklidir.</strong></p></div>' : ''}
  <div class="footer signature">
    <p style="margin:0;">${doctorName}</p>
    <p style="margin:4px 0 0 0; font-size: 10pt; color: #555;">İmza</p>
  </div>
  <p style="margin-top: 24px; font-size: 10pt; color: #666;">Rapor Tarihi: ${formatDateTR(report.createdAt)}</p>
</body>
</html>
  `.trim();
}

function openPrintWindow(report: MedicalReport, doctorName: string): void {
  const html = getReportPrintHtml(report, doctorName);
  const w = window.open('', '_blank', 'width=800,height=600');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.onload = () => {
    w.print();
    w.onafterprint = () => w.close();
  };
}

export function MedicalReportModal({
  opened,
  onClose,
  initial,
  report: reportProp,
  viewMode: viewModeProp = false,
  printAfterSave = false,
}: MedicalReportModalProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const diagnosisOptionsList = usePrescriptionStore((s) => s.diagnosisOptions);
  const addReport = useMedicalReportStore((s) => s.addReport);

  const viewMode = viewModeProp || !!reportProp;
  const report = reportProp ?? null;

  const doctorName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`.trim() || 'Dr.'
    : 'Dr.';

  const form = useForm({
    initialValues: {
      patientId: '',
      patientName: '',
      tcNo: '',
      startDate: null as Date | null,
      endDate: null as Date | null,
      diagnosis: '',
      description: '',
      checkupRequired: false,
    },
    validate: {
      patientName: (v: string) => (!v?.trim() ? 'Hasta adı gerekli' : null),
      startDate: (v: Date | null) => (!v ? 'Başlangıç tarihi gerekli' : null),
      endDate: (v: Date | null) => (!v ? 'Bitiş tarihi gerekli' : null),
      diagnosis: (v: string) => (!v?.trim() ? 'Tanı gerekli' : null),
    },
  });

  useEffect(() => {
    if (opened && initial && !viewMode) {
      form.setValues({
        patientId: initial.patientId,
        patientName: initial.patientName,
        tcNo: initial.tcNo ?? '',
        diagnosis: initial.diagnosis ?? '',
      });
    }
  }, [opened, initial, viewMode]);

  useEffect(() => {
    if (opened && viewMode && report) {
      form.setValues({
        patientId: report.patientId,
        patientName: report.patientName,
        tcNo: report.tcNo ?? '',
        startDate: report.startDate instanceof Date ? report.startDate : new Date(report.startDate),
        endDate: report.endDate instanceof Date ? report.endDate : new Date(report.endDate),
        diagnosis: report.diagnosis ?? '',
        description: report.description ?? '',
        checkupRequired: report.checkupRequired ?? false,
      });
    }
  }, [opened, viewMode, report]);

  const startDate = form.values.startDate;
  const endDate = form.values.endDate;

  const days = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return daysBetween(startDate, endDate);
  }, [startDate, endDate]);

  const returnToWorkDate = useMemo(() => {
    if (!endDate) return null;
    return addDays(endDate, 1);
  }, [endDate]);

  const handleSubmit = form.onSubmit((values) => {
    if (!values.startDate || !values.endDate) return;
    const rtwd = returnToWorkDate ?? addDays(values.endDate, 1);
    const report = addReport({
      patientId: values.patientId || `manual-${values.patientName}`,
      patientName: values.patientName.trim(),
      tcNo: values.tcNo.trim(),
      prescriptionId: initial?.prescriptionId,
      startDate: values.startDate,
      endDate: values.endDate,
      days,
      diagnosis: values.diagnosis.trim(),
      description: values.description.trim(),
      returnToWorkDate: rtwd,
      checkupRequired: values.checkupRequired,
    });
    form.reset();
    onClose();
    if (printAfterSave) {
      setTimeout(() => openPrintWindow(report, doctorName), 300);
    }
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handlePrintPreview = () => {
    if (!startDate || !endDate || !form.values.patientName.trim() || !form.values.diagnosis.trim()) return;
    const rtwd = returnToWorkDate ?? addDays(endDate, 1);
    const report: MedicalReport = {
      id: 'preview',
      patientId: form.values.patientId,
      patientName: form.values.patientName.trim(),
      tcNo: form.values.tcNo.trim(),
      prescriptionId: initial?.prescriptionId,
      startDate,
      endDate,
      days,
      diagnosis: form.values.diagnosis.trim(),
      description: form.values.description.trim(),
      returnToWorkDate: rtwd,
      checkupRequired: form.values.checkupRequired,
      createdAt: new Date(),
    };
    openPrintWindow(report, doctorName);
  };

  const diagnosisOptions = useMemo(
    () => diagnosisOptionsList.map((d) => d.label),
    [diagnosisOptionsList]
  );

  const handleViewPrint = () => {
    if (viewMode && report) {
      openPrintWindow(report, doctorName);
      return;
    }
    handlePrintPreview();
  };

  const displayDays = viewMode && report ? report.days : days;
  const displayReturnToWork = viewMode && report ? report.returnToWorkDate : returnToWorkDate;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={viewMode ? 'İstirahat Raporu' : 'İstirahat Raporu Yaz'}
      size="md"
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Hasta Adı Soyadı"
            placeholder="Hasta adı soyadı"
            required
            readOnly={viewMode}
            {...form.getInputProps('patientName')}
          />
          <TextInput
            label="TC Kimlik No"
            placeholder="11 hane"
            maxLength={11}
            readOnly={viewMode}
            {...form.getInputProps('tcNo')}
          />

          <Group grow>
            <DatePickerInput
              label="İstirahat Başlangıç Tarihi"
              placeholder="Tarih seçin"
              valueFormat="DD.MM.YYYY"
              required
              value={startDate}
              onChange={(d) => !viewMode && form.setFieldValue('startDate', d)}
              readOnly={viewMode}
            />
            <DatePickerInput
              label="İstirahat Bitiş Tarihi"
              placeholder="Tarih seçin"
              valueFormat="DD.MM.YYYY"
              required
              value={endDate}
              onChange={(d) => !viewMode && form.setFieldValue('endDate', d)}
              readOnly={viewMode}
            />
          </Group>

          <Paper withBorder p="sm" bg="gray.0">
            <Text size="sm" fw={500}>
              Süre: <strong>{displayDays} Gün</strong>
            </Text>
            {displayReturnToWork && (
              <Text size="sm" c="dimmed" mt={4}>
                İşe başlama tarihi: {formatDateTR(displayReturnToWork instanceof Date ? displayReturnToWork : new Date(displayReturnToWork))}
              </Text>
            )}
          </Paper>

          <TextInput
            label="Tanı"
            placeholder="Tanı girin veya seçin"
            required
            list="report-diagnosis-list"
            readOnly={viewMode}
            {...form.getInputProps('diagnosis')}
          />
          {!viewMode && (
            <datalist id="report-diagnosis-list">
              {diagnosisOptions.map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
          )}

          <Textarea
            label="Açıklama / Karar"
            placeholder="İsteğe bağlı açıklama"
            minRows={2}
            readOnly={viewMode}
            {...form.getInputProps('description')}
          />

          <Checkbox
            label="Kontrol gerekir mi?"
            disabled={viewMode}
            {...form.getInputProps('checkupRequired', { type: 'checkbox' })}
          />

          <Divider />

          <Group justify="space-between">
            {viewMode ? (
              <>
                <div />
                <Group>
                  <Button variant="subtle" type="button" onClick={handleClose}>
                    Kapat
                  </Button>
                  <Button type="button" onClick={handleViewPrint}>
                    Yazdır
                  </Button>
                </Group>
              </>
            ) : (
              <>
                <Button variant="default" type="button" onClick={handleViewPrint}>
                  Önizle / Yazdır
                </Button>
                <Group>
                  <Button variant="subtle" type="button" onClick={handleClose}>
                    İptal
                  </Button>
                  <Button type="submit">Kaydet</Button>
                </Group>
              </>
            )}
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
