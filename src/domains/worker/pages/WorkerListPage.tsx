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
  TextInput,
  Select,
  Group as MantineGroup,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconDownload, IconDots, IconEdit, IconTrash, IconKey, IconBuilding, IconCertificate, IconLink } from '@tabler/icons-react';
import { useTranslation } from '@shared/i18n';
import { useExportExcel } from '@shared/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { workerFormSchema, type WorkerFormValues } from '../schemas/workerSchema';
import { useWorkerStore, type Worker } from '@store/workerStore';

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

interface WorkerModalFormProps {
  worker: Worker | null;
  onSubmit: (data: WorkerFormValues) => void;
  onCancel: () => void;
  t: (key: string) => string;
}

function WorkerModalForm({ worker, onSubmit, onCancel, t }: WorkerModalFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WorkerFormValues>({
    resolver: zodResolver(workerFormSchema),
    defaultValues: worker
      ? {
          nameSurname: worker.nameSurname,
          idNumber: worker.idNumber,
          email: worker.email,
          mobileNo: worker.mobileNo ?? '',
          workNo: worker.workNo ?? '',
          jobTitle: worker.jobTitle ?? '',
          gender: worker.gender,
        }
      : {
          nameSurname: '',
          idNumber: '',
          email: '',
          mobileNo: '',
          workNo: '',
          jobTitle: '',
          gender: undefined,
        },
  });

  const employmentStartDate = watch('employmentStartDate');
  const employmentEndDate = watch('employmentEndDate');
  const dateOfBirth = watch('dateOfBirth');
  const visaDate = watch('visaDate');

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="md">
        <TextInput
          label={t('worker.form.nameSurname')}
          placeholder={t('worker.form.nameSurname')}
          {...register('nameSurname')}
          error={errors.nameSurname?.message}
          required
        />
        <TextInput
          label={t('worker.form.idNumber')}
          placeholder={t('worker.form.idNumber')}
          {...register('idNumber')}
          error={errors.idNumber?.message}
          required
        />
        <TextInput
          label={t('worker.form.email')}
          placeholder={t('worker.form.email')}
          type="email"
          {...register('email')}
          error={errors.email?.message}
          required
        />
        <TextInput
          label={t('worker.form.mobileNo')}
          placeholder={t('worker.form.mobileNo')}
          {...register('mobileNo')}
          error={errors.mobileNo?.message}
        />
        <TextInput
          label={t('worker.form.workNo')}
          placeholder={t('worker.form.workNo')}
          {...register('workNo')}
          error={errors.workNo?.message}
        />
        <TextInput
          label={t('worker.form.jobTitle')}
          placeholder={t('worker.form.jobTitle')}
          {...register('jobTitle')}
          error={errors.jobTitle?.message}
        />
        <MantineGroup grow>
          <DateInput
            label={t('worker.form.employmentStartDate')}
            value={employmentStartDate ?? null}
            onChange={(d) => setValue('employmentStartDate', d ?? undefined)}
            clearable
          />
          <DateInput
            label={t('worker.form.employmentEndDate')}
            value={employmentEndDate ?? null}
            onChange={(d) => setValue('employmentEndDate', d ?? undefined)}
            clearable
          />
        </MantineGroup>
        <DateInput
          label={t('worker.form.dateOfBirth')}
          value={dateOfBirth ?? null}
          onChange={(d) => setValue('dateOfBirth', d ?? undefined)}
          clearable
        />
        <Select
          label={t('worker.form.gender')}
          placeholder={t('worker.form.gender')}
          data={[
            { value: 'male', label: t('worker.genderMale') },
            { value: 'female', label: t('worker.genderFemale') },
            { value: 'other', label: t('worker.genderOther') },
          ]}
          value={watch('gender') ?? null}
          onChange={(v) => setValue('gender', (v as 'male' | 'female' | 'other') ?? undefined)}
          clearable
        />
        <DateInput
          label={t('worker.form.visaDate')}
          value={visaDate ?? null}
          onChange={(d) => setValue('visaDate', d ?? undefined)}
          clearable
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" type="button" onClick={onCancel}>
            {t('worker.back')}
          </Button>
          <Button type="submit">{worker ? t('worker.save') : t('worker.addWorker')}</Button>
        </Group>
      </Stack>
    </form>
  );
}

export function WorkerListPage() {
  const { t } = useTranslation();
  const { exportTableToExcel } = useExportExcel();
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  const workers = useWorkerStore((state) => state.workers);
  const addWorker = useWorkerStore((state) => state.addWorker);
  const updateWorker = useWorkerStore((state) => state.updateWorker);
  const deleteWorker = useWorkerStore((state) => state.deleteWorker);

  const handleDownloadTemplate = () => {
    exportTableToExcel(
      workers.map((w) => ({
        nameSurname: w.nameSurname,
        idNumber: w.idNumber,
        email: w.email,
        mobileNo: w.mobileNo ?? '',
        workNo: w.workNo ?? '',
        jobTitle: w.jobTitle ?? '',
      })),
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
    if (editingWorker) {
      updateWorker(editingWorker.id, data);
    } else {
      addWorker(data);
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
              <Table.Th>{t('worker.form.nameSurname')}</Table.Th>
              <Table.Th>{t('worker.form.idNumber')}</Table.Th>
              <Table.Th>{t('worker.form.email')}</Table.Th>
              <Table.Th>{t('worker.form.jobTitle')}</Table.Th>
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
        <WorkerModalForm
          key={editingWorker?.id ?? 'new'}
          worker={editingWorker}
          onSubmit={handleModalSubmit}
          onCancel={handleModalClose}
          t={t}
        />
      </Modal>
    </>
  );
}
