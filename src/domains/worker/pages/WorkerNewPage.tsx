import { Button, Title, Text, Stack, TextInput, Select, Group } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { Link } from 'react-router-dom';
import { IconArrowLeft } from '@tabler/icons-react';
import { useTranslation } from '@shared/i18n';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { workerFormSchema, type WorkerFormValues } from '../schemas/workerSchema';

export function WorkerNewPage() {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WorkerFormValues>({
    resolver: zodResolver(workerFormSchema),
    defaultValues: {
      nameSurname: '',
      idNumber: '',
      email: '',
      mobileNo: '',
      workNo: '',
      gender: undefined,
      jobTitle: '',
    },
  });

  const employmentStartDate = watch('employmentStartDate');
  const employmentEndDate = watch('employmentEndDate');
  const dateOfBirth = watch('dateOfBirth');
  const visaDate = watch('visaDate');

  const onSubmit = (data: WorkerFormValues) => {
    console.log(data);
  };

  return (
    <>
      <Button
        component={Link}
        to="/worker"
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        mb="md"
        size="sm"
      >
        {t('worker.back')}
      </Button>
      <Title order={2} mb="xs">{t('worker.newPageTitle')}</Title>
      <Text c="dimmed" size="sm" mb="lg">
        {t('worker.form.nameSurname')}, {t('worker.form.idNumber')}, {t('worker.form.email')}, …
      </Text>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md" maw={500}>
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
          <Group grow>
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
          </Group>
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
          <TextInput
            label={t('worker.form.jobTitle')}
            placeholder={t('worker.form.jobTitle')}
            {...register('jobTitle')}
            error={errors.jobTitle?.message}
          />
          <Group mt="md">
            <Button type="submit">{t('worker.addWorker')}</Button>
            <Button component={Link} to="/worker" variant="default">{t('worker.back')}</Button>
          </Group>
        </Stack>
      </form>
    </>
  );
}
