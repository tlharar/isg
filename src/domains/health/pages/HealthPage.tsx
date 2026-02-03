import { useMemo } from 'react';
import {
  Title,
  Text,
  Button,
  Group,
  Stack,
  Paper,
  Table,
  Modal,
  Textarea,
  TextInput,
  Select,
  NumberInput,
  Tabs,
  Badge,
  Checkbox,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { useTranslation } from '@shared/i18n';
import { useForm, Controller } from 'react-hook-form';
import { useHealthStore, type ExaminationInput, type Anamnesis, type Physical, type Labs, type Conclusion, defaultExaminationInput } from '../stores/healthStore';
import { useWorkerStore } from '@store/workerStore';
import { useAppStore } from '@shared/stores/appStore';

interface ExaminationFormValues {
  employeeId: string;
  employeeName: string;
  date: Date | null;
  anamnesis: Anamnesis;
  physical: Physical;
  labs: Labs;
  conclusion: Conclusion;
}

const RESULT_OPTIONS: { value: Conclusion['result']; label: string }[] = [
  { value: 'Elverişli', label: 'Elverişli (Çalışabilir)' },
  { value: 'Şartlı', label: 'Şartlı (Şartlı Çalışabilir)' },
  { value: 'Elverişsiz', label: 'Elverişsiz (Çalışamaz)' },
];

const PHYSICAL_FINDING_OPTIONS: { value: Physical['vision']; label: string }[] = [
  { value: 'Normal', label: 'Normal' },
  { value: 'Kusurlu', label: 'Kusurlu' },
];

function computeBmi(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function HealthPage() {
  const { t } = useTranslation();
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const workers = useWorkerStore((s) => s.workers);
  const examinations = useHealthStore((s) => s.examinations);
  const addExamination = useHealthStore((s) => s.addExamination);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const employeeOptions = useMemo(() => {
    let list = workers;
    if (selectedCompanyId) list = list.filter((w) => w.companyId === selectedCompanyId);
    return list.map((w) => ({ value: w.id, label: `${w.nameSurname}${w.jobTitle ? ` - ${w.jobTitle}` : ''}` }));
  }, [workers, selectedCompanyId]);

  const defaults = useMemo(() => {
    const d = defaultExaminationInput();
    return {
      employeeId: '',
      employeeName: '',
      date: new Date() as Date | null,
      anamnesis: d.anamnesis,
      physical: d.physical,
      labs: d.labs,
      conclusion: d.conclusion,
    } satisfies ExaminationFormValues;
  }, []);

  const { handleSubmit, setValue, watch, control, reset } = useForm<ExaminationFormValues>({
    defaultValues: defaults,
  });

  const height = watch('physical.height');
  const weight = watch('physical.weight');
  const bmi = useMemo(() => computeBmi(weight || 0, height || 0), [weight, height]);

  const handleOpenNewExam = () => {
    reset(defaults);
    openModal();
  };

  const handleCloseModal = () => closeModal();

  const onSubmit = (data: ExaminationFormValues) => {
    const nextExamDate = data.conclusion.nextExamDate;
    const input: ExaminationInput = {
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      date: data.date ? new Date(data.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      anamnesis: data.anamnesis,
      physical: { ...data.physical, bmi },
      labs: data.labs,
      conclusion: {
        ...data.conclusion,
        nextExamDate: typeof nextExamDate === 'string' ? nextExamDate : (nextExamDate ? new Date(nextExamDate).toISOString().slice(0, 10) : ''),
      },
    };
    addExamination(input);
    handleCloseModal();
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>{t('health.examination.title')}</Title>
            <Text c="dimmed" size="sm">{t('health.examination.subtitle')}</Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={handleOpenNewExam}>
            {t('health.examination.newExamination')} (EK-2)
          </Button>
        </Group>

        <Paper withBorder p="md">
          <Text size="sm" fw={500} mb="sm">{t('health.examination.recentExaminations')}</Text>
          {examinations.length === 0 ? (
            <Text size="sm" c="dimmed">{t('health.examination.noExaminations')}</Text>
          ) : (
            <Table.ScrollContainer minWidth={600}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('health.examination.table.employee')}</Table.Th>
                    <Table.Th>{t('health.examination.table.reportDate')}</Table.Th>
                    <Table.Th>{t('health.examination.table.conclusion')}</Table.Th>
                    <Table.Th>{t('health.examination.table.nextDate')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {examinations.slice(0, 25).map((e) => (
                    <Table.Tr key={e.id}>
                      <Table.Td>{e.employeeName || e.employeeId}</Table.Td>
                      <Table.Td>{e.date}</Table.Td>
                      <Table.Td>
                        <Badge color={e.conclusion.result === 'Elverişsiz' ? 'red' : e.conclusion.result === 'Şartlı' ? 'yellow' : 'green'} size="sm">
                          {e.conclusion.result}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{e.conclusion.nextExamDate || '—'}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Paper>
      </Stack>

      <Modal
        opened={modalOpened}
        onClose={handleCloseModal}
        title={t('health.examination.modalTitle')}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="md">
            <Select
              label={t('health.examination.form.employee')}
              placeholder={t('health.examination.form.employeePlaceholder')}
              data={employeeOptions}
              value={watch('employeeId') || null}
              onChange={(v) => {
                const w = workers.find((x) => x.id === v);
                setValue('employeeId', v ?? '');
                setValue('employeeName', w?.nameSurname ?? '');
              }}
              searchable
              required
            />
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DatePickerInput
                  label={t('health.examination.form.reportDate')}
                  placeholder={t('health.examination.form.reportDatePlaceholder')}
                  valueFormat="DD.MM.YYYY"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            <Tabs defaultValue="anamnez">
              <Tabs.List>
                <Tabs.Tab value="anamnez">{t('health.examination.tabs.anamnez')}</Tabs.Tab>
                <Tabs.Tab value="physical">{t('health.examination.tabs.physical')}</Tabs.Tab>
                <Tabs.Tab value="labs">{t('health.examination.tabs.labs')}</Tabs.Tab>
                <Tabs.Tab value="conclusion">{t('health.examination.tabs.conclusion')}</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="anamnez" pt="md">
                <Stack gap="md">
                  <Checkbox
                    label={t('health.examination.form.smoking')}
                    checked={watch('anamnesis.smoking')}
                    onChange={(e) => setValue('anamnesis.smoking', e.currentTarget.checked)}
                  />
                  <Checkbox
                    label={t('health.examination.form.alcohol')}
                    checked={watch('anamnesis.alcohol')}
                    onChange={(e) => setValue('anamnesis.alcohol', e.currentTarget.checked)}
                  />
                  <Textarea
                    label={t('health.examination.form.chronicDiseases')}
                    placeholder={t('health.examination.form.chronicDiseasesPlaceholder')}
                    value={watch('anamnesis.chronicIllnesses')}
                    onChange={(e) => setValue('anamnesis.chronicIllnesses', e.currentTarget.value)}
                    minRows={2}
                  />
                  <Textarea
                    label={t('health.examination.form.pastSurgeries')}
                    placeholder={t('health.examination.form.pastSurgeriesPlaceholder')}
                    value={watch('anamnesis.surgeries')}
                    onChange={(e) => setValue('anamnesis.surgeries', e.currentTarget.value)}
                    minRows={2}
                  />
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="physical" pt="md">
                <Stack gap="md">
                  <Group grow>
                    <Controller
                      name="physical.height"
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          label={t('health.examination.form.height')}
                          placeholder="cm"
                          min={0}
                          max={250}
                          value={field.value || ''}
                          onChange={(v) => field.onChange(typeof v === 'number' ? v : 0)}
                        />
                      )}
                    />
                    <Controller
                      name="physical.weight"
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          label={t('health.examination.form.weight')}
                          placeholder="kg"
                          min={0}
                          max={300}
                          value={field.value || ''}
                          onChange={(v) => field.onChange(typeof v === 'number' ? v : 0)}
                        />
                      )}
                    />
                    <NumberInput label={t('health.examination.form.bmi')} value={bmi} readOnly disabled placeholder="—" />
                  </Group>
                  <Group grow>
                    <Controller
                      name="physical.bloodPressure"
                      control={control}
                      render={({ field }) => (
                        <TextInput
                          label={t('health.examination.form.bloodPressure')}
                          placeholder="120/80"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    <Controller
                      name="physical.heartRate"
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          label={t('health.examination.form.pulse')}
                          placeholder="dk"
                          min={0}
                          max={200}
                          value={field.value || ''}
                          onChange={(v) => field.onChange(typeof v === 'number' ? v : 0)}
                        />
                      )}
                    />
                  </Group>
                  <Group grow>
                    <Select
                      label={t('health.examination.form.vision')}
                      data={PHYSICAL_FINDING_OPTIONS}
                      value={watch('physical.vision')}
                      onChange={(v) => setValue('physical.vision', (v as Physical['vision']) ?? 'Normal')}
                    />
                    <Select
                      label={t('health.examination.form.hearing')}
                      data={PHYSICAL_FINDING_OPTIONS}
                      value={watch('physical.hearing')}
                      onChange={(v) => setValue('physical.hearing', (v as Physical['hearing']) ?? 'Normal')}
                    />
                  </Group>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="labs" pt="md">
                <Stack gap="md">
                  <Controller
                    name="labs.bloodAnalysis"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        label={t('health.examination.form.bloodValues')}
                        placeholder={t('health.examination.form.bloodValuesPlaceholder')}
                        value={field.value}
                        onChange={field.onChange}
                        minRows={2}
                      />
                    )}
                  />
                  <Controller
                    name="labs.audiometry"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        label={t('health.examination.form.audiometry')}
                        placeholder={t('health.examination.form.audiometryPlaceholder')}
                        value={field.value}
                        onChange={field.onChange}
                        minRows={2}
                      />
                    )}
                  />
                  <Controller
                    name="labs.lungXray"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        label={t('health.examination.form.chestXRay')}
                        placeholder={t('health.examination.form.chestXRayPlaceholder')}
                        value={field.value}
                        onChange={field.onChange}
                        minRows={2}
                      />
                    )}
                  />
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="conclusion" pt="md">
                <Stack gap="md">
                  <Select
                    label={t('health.examination.form.conclusion')}
                    data={RESULT_OPTIONS}
                    value={watch('conclusion.result')}
                    onChange={(v) => setValue('conclusion.result', (v as Conclusion['result']) ?? 'Elverişli')}
                  />
                  <Controller
                    name="conclusion.nextExamDate"
                    control={control}
                    render={({ field }) => {
                      const val = field.value;
                      const dateVal = typeof val === 'string' ? (val ? new Date(val) : null) : (val ? new Date(val as string) : null);
                      return (
                        <DatePickerInput
                          label={t('health.examination.form.nextExaminationDate')}
                          placeholder={t('health.examination.form.nextExaminationDatePlaceholder')}
                          valueFormat="DD.MM.YYYY"
                          value={dateVal}
                          onChange={(d) => setValue('conclusion.nextExamDate', d ? new Date(d).toISOString().slice(0, 10) : '')}
                        />
                      );
                    }}
                  />
                  <Controller
                    name="conclusion.conditions"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        label={t('health.examination.form.conditions')}
                        placeholder={t('health.examination.form.conditionsPlaceholder')}
                        value={field.value}
                        onChange={field.onChange}
                        minRows={2}
                      />
                    )}
                  />
                </Stack>
              </Tabs.Panel>
            </Tabs>

            <Group justify="flex-end" mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
              <Button variant="default" type="button" onClick={handleCloseModal}>
                {t('company.back')}
              </Button>
              <Button type="submit">{t('health.examination.saveExamination')}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
