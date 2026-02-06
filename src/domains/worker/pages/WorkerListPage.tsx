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
import { modals } from '@mantine/modals';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconDownload, IconDots, IconEdit, IconTrash, IconKey, IconBuilding, IconCertificate, IconLink, IconMailForward } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from '@shared/i18n';
import { useExportExcel } from '@shared/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { workerFormSchema, type WorkerFormValues } from '../schemas/workerSchema';
import { useWorkerStore, type Worker, AUTO_ACCOUNT_JOB_TITLES } from '@store/workerStore';
import { useAppStore } from '@shared/stores/appStore';
import { useCompanyStore } from '@store/companyStore';
import { useAuthStore, canManagerAddWorker } from '@shared/stores/authStore';
import { WorkerAuthModal } from '../components/WorkerAuthModal';
import { WorkerCompaniesModal } from '../components/WorkerCompaniesModal';
import { WorkerVisaModal } from '../components/WorkerVisaModal';

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

interface WorkerModalFormProps {
  worker: Worker | null;
  selectedCompanyId: string | null;
  onSubmit: (data: WorkerFormValues) => void;
  onCancel: () => void;
  t: (key: string) => string;
}

function WorkerModalForm({ worker, selectedCompanyId, onSubmit, onCancel, t }: WorkerModalFormProps) {
  const companies = useCompanyStore((s) => s.companies);
  const getCompanyById = useCompanyStore((s) => s.getCompanyById);
  const {
    register,
    handleSubmit,
    setValue,
    setError,
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
          companyId: worker.companyId ?? undefined,
          subContractorId: worker.subContractorId ?? undefined,
        }
      : {
          nameSurname: '',
          idNumber: '',
          email: '',
          mobileNo: '',
          workNo: '',
          jobTitle: '',
          gender: undefined,
          companyId: selectedCompanyId ?? undefined,
          subContractorId: undefined,
        },
  });

  const employmentStartDate = watch('employmentStartDate');
  const employmentEndDate = watch('employmentEndDate');
  const dateOfBirth = watch('dateOfBirth');
  const visaDate = watch('visaDate');
  const companyId = watch('companyId');
  const showCompanySelect = !selectedCompanyId;

  const effectiveCompanyId = companyId ?? selectedCompanyId ?? null;
  const selectedCompany = effectiveCompanyId ? getCompanyById(effectiveCompanyId) : null;
  const subContractors = selectedCompany?.subContractors ?? [];
  const showSubContractorSelect = subContractors.length > 0;

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));
  const subContractorOptions = subContractors.map((s) => ({ value: s.id, label: s.name }));

  const handleFormSubmit = (data: WorkerFormValues) => {
    if (!data.jobTitle?.trim()) {
      setError('jobTitle', { message: 'Görevi seçmek zorunludur' });
      return;
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
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
        {showCompanySelect && (
          <Select
            label={t('worker.form.company')}
            placeholder={t('worker.form.company')}
            data={companyOptions}
            value={companyId ?? null}
            onChange={(v) => {
              setValue('companyId', v ?? undefined);
              setValue('subContractorId', undefined);
            }}
            clearable
          />
        )}
        {showSubContractorSelect && (
          <Select
            label={t('worker.form.subContractorOptional')}
            placeholder={t('worker.form.subContractorOptional')}
            data={subContractorOptions}
            value={watch('subContractorId') ?? null}
            onChange={(v) => setValue('subContractorId', v ?? undefined)}
            clearable
          />
        )}
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
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const { exportTableToExcel } = useExportExcel();
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [authModalWorker, setAuthModalWorker] = useState<Worker | null>(null);
  const [companiesModalWorker, setCompaniesModalWorker] = useState<Worker | null>(null);
  const [visaModalWorker, setVisaModalWorker] = useState<Worker | null>(null);

  const getCompanyById = useCompanyStore((s) => s.getCompanyById);
  const allWorkers = useWorkerStore((state) => state.workers);
  const workers = selectedCompanyId
    ? allWorkers.filter((w) => w.companyId === selectedCompanyId)
    : allWorkers;
  const addWorker = useWorkerStore((state) => state.addWorker);
  const updateWorker = useWorkerStore((state) => state.updateWorker);
  const deleteWorker = useWorkerStore((state) => state.deleteWorker);
  const resendWorkerCredentials = useWorkerStore((state) => state.resendWorkerCredentials);
  const currentUser = useAuthStore((s) => s.currentUser);
  const canAddWorker = canManagerAddWorker(currentUser);

  function getCompanySubContractorLabel(w: Worker): string {
    const company = w.companyId ? getCompanyById(w.companyId) : null;
    const companyName = company?.name ?? '—';
    if (!w.subContractorId || !company?.subContractors?.length) return companyName;
    const sub = company.subContractors.find((s) => s.id === w.subContractorId);
    return sub ? `${companyName} / ${sub.name}` : companyName;
  }

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
    modals.openConfirmModal({
      title: t('worker.actions.delete'),
      children: <Text size="sm">{t('worker.deleteConfirm')}</Text>,
      labels: { confirm: t('common.delete'), cancel: t('common.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        deleteWorker(worker.id);
      },
    });
  };

  const handleAuthSave = (roles: string[]) => {
    if (authModalWorker) {
      updateWorker(authModalWorker.id, { roles });
      setAuthModalWorker(null);
    }
  };

  const handlePasswordLinkClick = (worker: Worker) => {
    const url = `https://app.com/reset-pass?user=${worker.id}`;
    void navigator.clipboard.writeText(url);
    notifications.show({
      title: 'Bağlantı kopyalandı',
      message: 'Şifre oluşturma linki panoya kopyalandı.',
      color: 'green',
    });
  };

  const handleModalSubmit = (data: WorkerFormValues) => {
    const payload = {
      ...data,
      companyId: data.companyId ?? (editingWorker ? editingWorker.companyId : selectedCompanyId ?? undefined),
      subContractorId: data.subContractorId ?? (editingWorker ? editingWorker.subContractorId : undefined),
    };
    if (editingWorker) {
      updateWorker(editingWorker.id, payload);
    } else {
      if (!canAddWorker) {
        notifications.show({
          title: 'Limit aşıldı',
          message: 'Kullanıcı limitiniz doldu. Yeni çalışan ekleyemezsiniz.',
          color: 'red',
        });
        return;
      }
      addWorker(payload);
      const isAutoAccount =
        payload.jobTitle && AUTO_ACCOUNT_JOB_TITLES.includes(payload.jobTitle as (typeof AUTO_ACCOUNT_JOB_TITLES)[number]);
      if (isAutoAccount) {
        notifications.show({
          title: 'Başarılı',
          message: 'Kullanıcı oluşturuldu ve bilgilendirme maili gönderildi.',
          color: 'green',
        });
      }
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
            <Button leftSection={<IconPlus size={16} />} size="sm" onClick={handleAddClick} disabled={!canAddWorker} title={!canAddWorker ? 'Kullanıcı limitiniz doldu. Yeni çalışan ekleyemezsiniz.' : undefined}>
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
              <Table.Th>{t('worker.table.company')}</Table.Th>
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
                  <Text size="sm">{getCompanySubContractorLabel(w)}</Text>
                </Table.Td>
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
                      <Menu.Item
                        leftSection={<IconKey size={14} />}
                        onClick={() => setAuthModalWorker(w)}
                      >
                        {t('worker.actions.authorization')}
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconBuilding size={14} />}
                        onClick={() => setCompaniesModalWorker(w)}
                      >
                        {t('worker.actions.companies')}
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconCertificate size={14} />}
                        onClick={() => setVisaModalWorker(w)}
                      >
                        {t('worker.actions.activeVisaInquiry')}
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconLink size={14} />}
                        onClick={() => handlePasswordLinkClick(w)}
                      >
                        {t('worker.actions.passwordCreationLink')}
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconMailForward size={14} />}
                        onClick={() => {
                          const ok = resendWorkerCredentials(w.id);
                          if (ok) {
                            notifications.show({ title: 'Başarılı', message: 'Şifre sıfırlandı ve mail tekrar gönderildi.', color: 'green' });
                          } else {
                            notifications.show({ title: 'Hata', message: 'Giriş bilgileri gönderilemedi. Kullanıcı hesabı bulunamadı veya yetkiniz yok.', color: 'red' });
                          }
                        }}
                        title="Giriş Bilgilerini Tekrar Gönder"
                      >
                        Giriş Bilgilerini Tekrar Gönder
                      </Menu.Item>
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
          selectedCompanyId={selectedCompanyId}
          onSubmit={handleModalSubmit}
          onCancel={handleModalClose}
          t={t}
        />
      </Modal>

      <WorkerAuthModal
        opened={!!authModalWorker}
        onClose={() => setAuthModalWorker(null)}
        worker={authModalWorker}
        onSave={handleAuthSave}
      />
      <WorkerCompaniesModal
        opened={!!companiesModalWorker}
        onClose={() => setCompaniesModalWorker(null)}
        worker={companiesModalWorker}
      />
      <WorkerVisaModal
        opened={!!visaModalWorker}
        onClose={() => setVisaModalWorker(null)}
        worker={visaModalWorker}
      />
    </>
  );
}
