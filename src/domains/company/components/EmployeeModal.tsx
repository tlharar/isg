import {
  Stack,
  TextInput,
  Select,
  Button,
  Group,
  Group as MantineGroup,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { workerFormSchema, type WorkerFormValues } from '@domains/worker/schemas/workerSchema';
import { useCompanyStore } from '@store/companyStore';
import type { Worker } from '@store/workerStore';

/** Standard job titles for Görevi / Ünvanı. When "Diğer" is selected, a text input is shown. */
export const JOB_TITLE_OPTIONS = [
  'İş Güvenliği Uzmanı',
  'İşyeri Hekimi',
  'Diğer Sağlık Personeli',
  'İnsan Kaynakları',
  'Diğer',
] as const;

const JOB_TITLE_SELECT_DATA = JOB_TITLE_OPTIONS.map((v) => ({ value: v, label: v }));

function getInitialJobTitleSelect(worker: Worker | null): string {
  if (!worker?.jobTitle?.trim()) return '';
  const value = worker.jobTitle.trim();
  if (JOB_TITLE_OPTIONS.includes(value as (typeof JOB_TITLE_OPTIONS)[number])) return value;
  return 'Diğer';
}

function getInitialJobTitleOther(worker: Worker | null): string {
  if (!worker?.jobTitle?.trim()) return '';
  const value = worker.jobTitle.trim();
  if (JOB_TITLE_OPTIONS.includes(value as (typeof JOB_TITLE_OPTIONS)[number])) return '';
  return value;
}

export interface EmployeeModalProps {
  worker: Worker | null;
  selectedCompanyId: string | null;
  onSubmit: (data: WorkerFormValues) => void;
  onCancel: () => void;
  t: (key: string) => string;
}

export function EmployeeModal({ worker, selectedCompanyId, onSubmit, onCancel, t }: EmployeeModalProps) {
  const companies = useCompanyStore((s) => s.companies);
  const getCompanyById = useCompanyStore((s) => s.getCompanyById);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<WorkerFormValues & { jobTitleSelect: string; jobTitleOther: string }>({
    resolver: zodResolver(workerFormSchema),
    defaultValues: worker
      ? {
          nameSurname: worker.nameSurname,
          idNumber: worker.idNumber,
          email: worker.email,
          mobileNo: worker.mobileNo ?? '',
          workNo: worker.workNo ?? '',
          jobTitle: worker.jobTitle ?? '',
          jobTitleSelect: getInitialJobTitleSelect(worker),
          jobTitleOther: getInitialJobTitleOther(worker),
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
          jobTitleSelect: '',
          jobTitleOther: '',
          gender: undefined,
          companyId: selectedCompanyId ?? undefined,
          subContractorId: undefined,
        },
  });

  const employmentStartDate = watch('employmentStartDate');
  const employmentEndDate = watch('employmentEndDate');
  const dateOfBirth = watch('dateOfBirth');
  const visaDate = watch('visaDate');
  const jobTitleSelect = watch('jobTitleSelect');
  const companyId = watch('companyId');
  const showCompanySelect = !selectedCompanyId;
  const showJobTitleOther = jobTitleSelect === 'Diğer';

  const effectiveCompanyId = companyId ?? selectedCompanyId ?? null;
  const selectedCompany = effectiveCompanyId ? getCompanyById(effectiveCompanyId) : null;
  const subContractors = selectedCompany?.subContractors ?? [];
  const showSubContractorSelect = subContractors.length > 0;
  const subContractorOptions = subContractors.map((s) => ({ value: s.id, label: s.name }));

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  const handleFormSubmit = (data: WorkerFormValues) => {
    const jobTitleSelect = getValues('jobTitleSelect');
    const jobTitleOther = getValues('jobTitleOther');
    const jobTitle =
      jobTitleSelect === 'Diğer' ? (jobTitleOther ?? '').trim() : (jobTitleSelect ?? '').trim();
    onSubmit({ ...data, jobTitle: jobTitle || undefined });
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
        <Select
          label={t('worker.form.jobTitle')}
          placeholder={t('worker.form.jobTitle')}
          data={JOB_TITLE_SELECT_DATA}
          value={jobTitleSelect || null}
          onChange={(v) => {
            setValue('jobTitleSelect', v ?? '');
            if (v !== 'Diğer') setValue('jobTitleOther', '');
          }}
          clearable
        />
        {showJobTitleOther && (
          <TextInput
            label={t('worker.form.jobTitleOtherPlaceholder')}
            placeholder={t('worker.form.jobTitleOtherPlaceholder')}
            value={watch('jobTitleOther')}
            onChange={(e) => setValue('jobTitleOther', e.currentTarget.value)}
          />
        )}
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
