import { useState } from 'react';
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
  FileInput,
  Modal,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconDownload, IconDots, IconEdit, IconTrash, IconKey, IconBuilding, IconCertificate, IconLink } from '@tabler/icons-react';
import { useTranslation } from '@shared/i18n';
import { useExportExcel } from '@shared/utils';
import type { WorkerFormValues } from '@domains/worker/schemas/workerSchema';
import { useWorkerStore, type Worker } from '@store/workerStore';
import { useAppStore } from '@shared/stores/appStore';
import { EmployeeModal } from '@domains/company/components/EmployeeModal';

const SAMPLE_WORKER_COLUMNS = [
  'nameSurname',
  'idNumber',
  'email',
  'mobileNo',
  'workNo',
  'employmentStartDate',
  'employmentEndDate',
  'dateOfBirth',
  'gender',
  'visaDate',
  'jobTitle',
] as const;

type WorkerExportRow = Record<(typeof SAMPLE_WORKER_COLUMNS)[number], string>;

function workerToExportRow(w: Worker): WorkerExportRow {
  const formatDate = (d: Date | undefined): string =>
    d ? (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10)) : '';
  return {
    nameSurname: w.nameSurname,
    idNumber: w.idNumber,
    email: w.email,
    mobileNo: w.mobileNo ?? '',
    workNo: w.workNo ?? '',
    employmentStartDate: formatDate(w.employmentStartDate),
    employmentEndDate: formatDate(w.employmentEndDate),
    dateOfBirth: formatDate(w.dateOfBirth),
    gender: w.gender ?? '',
    visaDate: formatDate(w.visaDate),
    jobTitle: w.jobTitle ?? '',
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
    exportTableToExcel<WorkerExportRow>(
      workers.map(workerToExportRow),
      [...SAMPLE_WORKER_COLUMNS],
      'worker-template'
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
            <Group align="flex-end">
              <FileInput
                placeholder={t('worker.uploadExcel')}
                value={uploadFile}
                onChange={setUploadFile}
                accept=".xlsx,.xls"
                clearable
                style={{ minWidth: 220 }}
              />
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
