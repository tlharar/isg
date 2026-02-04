import { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Title,
  Text,
  Button,
  Group,
  Stack,
  Paper,
  Table,
  ActionIcon,
  Menu,
  FileButton,
  Badge,
  Modal,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconDownload, IconDots, IconEdit, IconTrash, IconKey, IconBuilding, IconCertificate, IconLink, IconUpload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from '@shared/i18n';
import { useExportExcel } from '@shared/utils';
import type { WorkerFormValues } from '@domains/worker/schemas/workerSchema';
import { useWorkerStore, type Worker } from '@store/workerStore';
import { useAppStore } from '@shared/stores/appStore';
import { EmployeeModal } from '@domains/company/components/EmployeeModal';

/** Turkish column headers for the Excel template */
const TURKISH_TEMPLATE_COLUMNS = [
  'Ad',
  'Soyad',
  'TC Kimlik No',
  'Görevi',
  'E-posta',
  'Telefon',
  'Doğum Tarihi',
  'İşe Giriş Tarihi',
  'Cinsiyet',
] as const;

type TurkishTemplateRow = Record<(typeof TURKISH_TEMPLATE_COLUMNS)[number], string>;

/** Map Turkish headers from uploaded file to internal keys */
const HEADER_MAPPING: Record<string, string> = {
  'Ad': 'name',
  'Soyad': 'surname',
  'TC Kimlik No': 'tcNo',
  'Görevi': 'jobTitle',
  'E-posta': 'email',
  'Telefon': 'phone',
  'Doğum Tarihi': 'birthDate',
  'İşe Giriş Tarihi': 'startDate',
  'Cinsiyet': 'gender',
};

const GENDER_TO_TURKISH: Record<string, string> = {
  male: 'Erkek',
  female: 'Kadın',
  other: 'Diğer',
};

function workerToTurkishTemplateRow(w: Worker): TurkishTemplateRow {
  const formatDate = (d: Date | undefined): string =>
    d ? (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10)) : '';
  const parts = (w.nameSurname ?? '').trim().split(/\s+/);
  const ad = parts[0] ?? '';
  const soyad = parts.slice(1).join(' ') ?? '';
  return {
    'Ad': ad,
    'Soyad': soyad,
    'TC Kimlik No': w.idNumber ?? '',
    'Görevi': w.jobTitle ?? '',
    'E-posta': w.email ?? '',
    'Telefon': w.mobileNo ?? '',
    'Doğum Tarihi': formatDate(w.dateOfBirth),
    'İşe Giriş Tarihi': formatDate(w.employmentStartDate),
    'Cinsiyet': w.gender ? (GENDER_TO_TURKISH[w.gender] ?? w.gender) : '',
  };
}

/** Map a row with Turkish keys to internal keys using HEADER_MAPPING */
function mapRowToInternalKeys(row: Record<string, unknown>): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [turkishKey, internalKey] of Object.entries(HEADER_MAPPING)) {
    const value = row[turkishKey];
    if (value !== undefined && value !== null) {
      mapped[internalKey] = String(value).trim();
    }
  }
  return mapped;
}

const GENDER_NORMALIZE: Record<string, WorkerFormValues['gender']> = {
  'erkek': 'male',
  'kadın': 'female',
  'kadin': 'female',
  'diğer': 'other',
  'diger': 'other',
};

/** Build WorkerFormValues from mapped row (internal keys) and optional companyId */
function mappedRowToWorkerFormValues(mapped: Record<string, string>, companyId: string | null): WorkerFormValues {
  const name = (mapped.name ?? '').trim();
  const surname = (mapped.surname ?? '').trim();
  const nameSurname = [name, surname].filter(Boolean).join(' ') || '';
  const parseDate = (s: string): Date | undefined => {
    if (!s) return undefined;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? undefined : d;
  };
  const rawGender = (mapped.gender ?? '').trim().toLowerCase();
  const gender = GENDER_NORMALIZE[rawGender] ?? (rawGender ? (rawGender as WorkerFormValues['gender']) : undefined);
  return {
    nameSurname,
    idNumber: mapped.tcNo ?? '',
    email: mapped.email ?? '',
    jobTitle: mapped.jobTitle || undefined,
    mobileNo: mapped.phone || undefined,
    dateOfBirth: parseDate(mapped.birthDate),
    employmentStartDate: parseDate(mapped.startDate),
    gender,
    companyId: companyId ?? undefined,
  };
}

/** Company Employees (Firma Çalışanları): full Worker CRUD, Excel import, workerStore */
export function CompanyEmployeesPage() {
  const { t } = useTranslation();
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const { exportTableToExcel } = useExportExcel();
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  const allWorkers = useWorkerStore((state) => state.workers);
  const workers = selectedCompanyId
    ? allWorkers.filter((w) => w.companyId === selectedCompanyId)
    : allWorkers;
  const addWorker = useWorkerStore((state) => state.addWorker);
  const updateWorker = useWorkerStore((state) => state.updateWorker);
  const deleteWorker = useWorkerStore((state) => state.deleteWorker);

  const handleDownloadTemplate = () => {
    const rows: TurkishTemplateRow[] = workers.length > 0
      ? workers.map(workerToTurkishTemplateRow)
      : [TURKISH_TEMPLATE_COLUMNS.reduce((acc, col) => ({ ...acc, [col]: '' }), {} as TurkishTemplateRow)];
    exportTableToExcel<TurkishTemplateRow>(
      rows,
      [...TURKISH_TEMPLATE_COLUMNS],
      'calisan-sablonu'
    );
  };

  const handleAddClick = () => {
    setEditingWorker(null);
    openModal();
  };

  const handleEditClick = (worker: Worker) => {
    setEditingWorker(worker);
    openModal();
  };

  const handleDeleteClick = (worker: Worker) => {
    if (window.confirm(t('worker.deleteConfirm'))) {
      deleteWorker(worker.id);
    }
  };

  const handleModalSubmit = (data: WorkerFormValues) => {
    const payload = {
      ...data,
      companyId: data.companyId ?? (editingWorker ? editingWorker.companyId : selectedCompanyId ?? undefined),
    };
    if (editingWorker) {
      updateWorker(editingWorker.id, payload);
    } else {
      addWorker(payload);
    }
    closeModal();
    setEditingWorker(null);
  };

  const handleModalClose = () => {
    closeModal();
    setEditingWorker(null);
  };

  const handleImport = () => {
    const file = uploadFile;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        let addedCount = 0;
        let skippedCount = 0;

        jsonData.forEach((row) => {
          const mapped = mapRowToInternalKeys(row);
          const nameSurname = [mapped.name, mapped.surname].filter(Boolean).join(' ').trim();
          const tcNo = (mapped.tcNo ?? '').trim();
          if (!nameSurname || !tcNo) {
            skippedCount++;
            return;
          }
          const payload = mappedRowToWorkerFormValues(mapped, selectedCompanyId);
          addWorker(payload);
          addedCount++;
        });

        if (addedCount > 0) {
          notifications.show({
            title: 'İçe aktarma başarılı',
            message: `${addedCount} çalışan eklendi.`,
            color: 'green',
          });
        }
        if (skippedCount > 0) {
          notifications.show({
            title: 'Atlanan satırlar',
            message: `${skippedCount} satır Ad/Soyad veya TC Kimlik No eksik olduğu için atlandı.`,
            color: 'yellow',
          });
        }
        setUploadFile(null);
      } catch (err) {
        console.error('Excel import error:', err);
        notifications.show({
          title: 'İçe aktarma hatası',
          message: 'Excel dosyası işlenirken bir hata oluştu.',
          color: 'red',
        });
        setUploadFile(null);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <>
      <Stack gap="md" mb="md">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <div>
            <Title order={2}>{t('worker.title')}</Title>
            <Text c="dimmed" size="sm">{t('worker.subtitle')}</Text>
          </div>
          <Group gap="xs" wrap="wrap">
            <Button variant="light" leftSection={<IconDownload size={16} />} onClick={handleDownloadTemplate} size="sm">
              {t('worker.downloadTemplate')}
            </Button>
            <Button leftSection={<IconPlus size={16} />} size="sm" onClick={handleAddClick}>
              {t('worker.addWorker')}
            </Button>
          </Group>
        </Group>

        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Text size="sm" fw={500}>{t('worker.uploadExcel')}</Text>
            <Group align="center" gap="sm">
              <FileButton onChange={setUploadFile} accept=".xlsx,.xls">
                {(props) => (
                  <Button
                    {...props}
                    variant="filled"
                    color="green"
                    leftSection={<IconUpload size={18} />}
                  >
                    {t('worker.uploadExcel')}
                  </Button>
                )}
              </FileButton>
              {uploadFile && (
                <>
                  <Badge variant="light" color="green" size="lg">
                    {uploadFile.name}
                  </Badge>
                  <Button variant="light" color="green" onClick={handleImport}>
                    Yükle / İçe Aktar
                  </Button>
                </>
              )}
            </Group>
          </Stack>
        </Paper>
      </Stack>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('worker.table.nameSurname')}</Table.Th>
              <Table.Th>{t('worker.form.idNumber')}</Table.Th>
              <Table.Th>{t('worker.form.email')}</Table.Th>
              <Table.Th>{t('worker.table.jobTitle')}</Table.Th>
              <Table.Th style={{ width: 50 }} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {workers.map((w) => (
              <Table.Tr key={w.id}>
                <Table.Td>{w.nameSurname}</Table.Td>
                <Table.Td>{w.idNumber}</Table.Td>
                <Table.Td>{w.email}</Table.Td>
                <Table.Td>{w.jobTitle ?? '—'}</Table.Td>
                <Table.Td>
                  <Menu shadow="md" width={220} position="bottom-end">
                    <Menu.Target>
                      <ActionIcon variant="subtle" size="sm">
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconEdit size={14} />}
                        onClick={() => handleEditClick(w)}
                      >
                        {t('worker.actions.edit')}
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconTrash size={14} />}
                        color="red"
                        onClick={() => handleDeleteClick(w)}
                      >
                        {t('worker.actions.delete')}
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item leftSection={<IconKey size={14} />}>{t('worker.actions.authorization')}</Menu.Item>
                      <Menu.Item leftSection={<IconBuilding size={14} />}>{t('worker.actions.companies')}</Menu.Item>
                      <Menu.Item leftSection={<IconCertificate size={14} />}>{t('worker.actions.activeVisaInquiry')}</Menu.Item>
                      <Menu.Item leftSection={<IconLink size={14} />}>{t('worker.actions.passwordCreationLink')}</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal
        opened={modalOpened}
        onClose={handleModalClose}
        title={editingWorker ? t('worker.editPageTitle') : t('worker.newPageTitle')}
        size="md"
      >
        <EmployeeModal
          key={editingWorker?.id ?? 'new'}
          worker={editingWorker}
          selectedCompanyId={selectedCompanyId}
          onSubmit={handleModalSubmit}
          onCancel={handleModalClose}
          t={t}
        />
      </Modal>
    </>
  );
}
