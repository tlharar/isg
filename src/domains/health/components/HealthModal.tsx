import { useMemo, useState } from 'react';
import {
  Modal,
  Tabs,
  Stack,
  Group,
  Button,
  Select,
  Text,
  TextInput,
  NumberInput,
  Textarea,
  Checkbox,
  Alert,
  List,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { useForm, Controller } from 'react-hook-form';
import { notifications } from '@mantine/notifications';
import { useTranslation } from '@shared/i18n';
import { useWorkerStore, AUTO_ACCOUNT_JOB_TITLES } from '@store/workerStore';
import { useCompanyStore } from '@store/companyStore';
import { useAppStore } from '@shared/stores/appStore';
import { useAuthStore, canManagerAddWorker } from '@shared/stores/authStore';
import {
  useHealthStore,
  computeValidUntil,
  getIbysValidationErrors,
  defaultExaminationInput,
  type Examination,
  type ExaminationInput,
  type Anamnesis,
  type Physical,
  type Labs,
  type Conclusion,
  type ExamType,
} from '../stores/healthStore';
import type { WorkerFormValues } from '@domains/worker/schemas/workerSchema';

interface ExaminationFormValues {
  employeeId: string;
  employeeName: string;
  companyId: string;
  examType: ExamType;
  date: Date | null;
  validUntil: string;
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

const EXAM_TYPE_OPTIONS: { value: ExamType; label: string }[] = [
  { value: 'İşe Giriş', label: 'İşe Giriş' },
  { value: 'Periyodik', label: 'Periyodik' },
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

interface HealthModalProps {
  opened: boolean;
  onClose: () => void;
  examinationId?: string | null;
  onSaved?: () => void;
}

export function HealthModal({
  opened,
  onClose,
  examinationId,
  onSaved,
}: HealthModalProps) {
  const { t } = useTranslation();
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const workers = useWorkerStore((s) => s.workers);
  const addWorker = useWorkerStore((s) => s.addWorker);
  const currentUser = useAuthStore((s) => s.currentUser);
  const canAddWorker = canManagerAddWorker(currentUser);
  const companies = useCompanyStore((s) => s.companies);
  const getCompanyById = useCompanyStore((s) => s.getCompanyById);
  const getExaminationById = useHealthStore((s) => s.getExaminationById);
  const addExamination = useHealthStore((s) => s.addExamination);
  const updateExamination = useHealthStore((s) => s.updateExamination);

  const [searchAllCompanies, setSearchAllCompanies] = useState(false);
  const [quickAddOpened, { open: openQuickAdd, close: closeQuickAdd }] = useDisclosure(false);

  const existingExam = useMemo(
    () => (examinationId ? getExaminationById(examinationId) : null),
    [examinationId, getExaminationById]
  );

  const employeeOptions = useMemo(() => {
    let list = workers;
    if (!searchAllCompanies && selectedCompanyId) {
      list = list.filter((w) => w.companyId === selectedCompanyId);
    }
    return list.map((w) => ({
      value: w.id,
      label: `${w.nameSurname}${w.jobTitle ? ` - ${w.jobTitle}` : ''}`,
    }));
  }, [workers, selectedCompanyId, searchAllCompanies]);

  const companyOptions = useMemo(
    () => companies.map((c) => ({ value: c.id, label: c.name })),
    [companies]
  );

  const defaultValues = useMemo((): ExaminationFormValues => {
    const d = defaultExaminationInput();
    if (existingExam) {
      return {
        employeeId: existingExam.employeeId ?? '',
        employeeName: existingExam.employeeName ?? '',
        companyId: existingExam.companyId ?? '',
        examType: existingExam.examType ?? 'Periyodik',
        date: existingExam.date ? new Date(existingExam.date) : null,
        validUntil: existingExam.validUntil ?? '',
        anamnesis: existingExam.anamnesis,
        physical: existingExam.physical,
        labs: existingExam.labs,
        conclusion: existingExam.conclusion,
      };
    }
    return {
      employeeId: '',
      employeeName: '',
      companyId: selectedCompanyId ?? '',
      examType: 'Periyodik',
      date: new Date(),
      validUntil: '',
      anamnesis: d.anamnesis,
      physical: d.physical,
      labs: d.labs,
      conclusion: d.conclusion,
    };
  }, [existingExam, selectedCompanyId]);

  const { handleSubmit, setValue, watch, control, reset } = useForm<ExaminationFormValues>({
    defaultValues,
  });

  const employeeId = watch('employeeId');
  const date = watch('date');
  const companyId = watch('companyId');
  const height = watch('physical.height');
  const weight = watch('physical.weight');

  const company = useMemo(
    () => (companyId ? getCompanyById(companyId) : null),
    [companyId, getCompanyById]
  );
  const dangerClass = company?.dangerClass;

  const validUntilAuto = useMemo(() => {
    if (!date) return '';
    const iso = date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10);
    return computeValidUntil(iso, dangerClass);
  }, [date, dangerClass]);

  const bmi = useMemo(() => computeBmi(weight || 0, height || 0), [weight, height]);

  const currentExamForValidation = useMemo((): Examination | null => {
    const empId = watch('employeeId');
    const empName = watch('employeeName');
    const d = watch('date');
    const vu = watch('validUntil') || validUntilAuto;
    const an = watch('anamnesis');
    const ph = watch('physical');
    const la = watch('labs');
    const co = watch('conclusion');
    const dateStr = d ? (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10)) : '';
    return {
      id: existingExam?.id ?? '',
      employeeId: empId,
      employeeName: empName,
      companyId: watch('companyId'),
      examType: watch('examType'),
      date: dateStr,
      validUntil: vu,
      anamnesis: an,
      physical: { ...ph, bmi },
      labs: la,
      conclusion: co,
      sentToIbys: existingExam?.sentToIbys ?? false,
      createdAt: existingExam?.createdAt ?? '',
    };
  }, [watch, existingExam, validUntilAuto, bmi]);

  const ibysErrors = useMemo(
    () => (currentExamForValidation ? getIbysValidationErrors(currentExamForValidation) : []),
    [currentExamForValidation]
  );

  const onEmployeeChange = (value: string | null) => {
    const w = workers.find((x) => x.id === value);
    setValue('employeeId', value ?? '');
    setValue('employeeName', w?.nameSurname ?? '');
    setValue('companyId', w?.companyId ?? selectedCompanyId ?? '');
  };

  const onReportDateChange = (d: Date | null) => {
    setValue('date', d);
    const iso = d ? (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10)) : '';
    const vu = computeValidUntil(iso, dangerClass);
    setValue('validUntil', vu);
  };

  const handleOpen = () => {
    reset(defaultValues);
    setSearchAllCompanies(false);
  };

  const handleQuickAddSubmit = (data: WorkerFormValues) => {
    if (!canAddWorker) {
      notifications.show({
        title: 'Limit aşıldı',
        message: 'Kullanıcı limitiniz doldu. Yeni çalışan ekleyemezsiniz.',
        color: 'red',
      });
      return;
    }
    const worker = addWorker(data);
    const isAutoAccount =
      data.jobTitle && AUTO_ACCOUNT_JOB_TITLES.includes(data.jobTitle as (typeof AUTO_ACCOUNT_JOB_TITLES)[number]);
    if (isAutoAccount) {
      notifications.show({
        title: 'Başarılı',
        message: 'Kullanıcı oluşturuldu ve bilgilendirme maili gönderildi.',
        color: 'green',
      });
    }
    onEmployeeChange(worker.id);
    closeQuickAdd();
  };

  const onSubmit = (data: ExaminationFormValues) => {
    const nextExamDate = data.conclusion.nextExamDate;
    const dateStr = data.date
      ? (data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date).slice(0, 10))
      : new Date().toISOString().slice(0, 10);
    const validUntilStr = data.validUntil || validUntilAuto;

    if (existingExam) {
      updateExamination(existingExam.id, {
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        companyId: data.companyId,
        examType: data.examType,
        date: dateStr,
        validUntil: validUntilStr,
        anamnesis: data.anamnesis,
        physical: { ...data.physical, bmi },
        labs: data.labs,
        conclusion: {
          ...data.conclusion,
          nextExamDate:
            typeof nextExamDate === 'string'
              ? nextExamDate
              : nextExamDate
                ? new Date(nextExamDate).toISOString().slice(0, 10)
                : '',
        },
      });
    } else {
      const input: ExaminationInput = {
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        companyId: data.companyId,
        examType: data.examType,
        date: dateStr,
        validUntil: validUntilStr,
        anamnesis: data.anamnesis,
        physical: { ...data.physical, bmi },
        labs: data.labs,
        conclusion: {
          ...data.conclusion,
          nextExamDate:
            typeof nextExamDate === 'string'
              ? nextExamDate
              : nextExamDate
                ? new Date(nextExamDate).toISOString().slice(0, 10)
                : '',
        },
        sentToIbys: false,
      };
      addExamination(input);
    }
    onSaved?.();
    onClose();
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        transitionProps={{ onEntered: handleOpen }}
        title={existingExam ? 'Muayene Düzenle (EK-2)' : 'Yeni Muayene (EK-2)'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="personnel">
            <Tabs.List>
              <Tabs.Tab value="personnel">Personel & Genel</Tabs.Tab>
              <Tabs.Tab value="anamnez">Tıbbi Anamnez</Tabs.Tab>
              <Tabs.Tab value="physical">Fiziki Muayene</Tabs.Tab>
              <Tabs.Tab value="conclusion">Kanaat ve Sonuç</Tabs.Tab>
              <Tabs.Tab value="ibys">İBYS Kontrol</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="personnel" pt="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Select
                    label={t('health.examination.form.employee')}
                    placeholder={t('health.examination.form.employeePlaceholder')}
                    data={employeeOptions}
                    value={employeeId || null}
                    onChange={onEmployeeChange}
                    searchable
                    clearable
                    required
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="button"
                    variant="light"
                    size="sm"
                    mt="xl"
                    onClick={openQuickAdd}
                  >
                    + Hızlı Çalışan Ekle
                  </Button>
                </Group>
                <Checkbox
                  label="Tüm firmalardan ara"
                  checked={searchAllCompanies}
                  onChange={(e) => setSearchAllCompanies(e.currentTarget.checked)}
                />
                <Select
                  label="Muayene türü"
                  data={EXAM_TYPE_OPTIONS}
                  value={watch('examType') || null}
                  onChange={(v) => setValue('examType', (v as ExamType) ?? 'Periyodik')}
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
                      onChange={(d) => {
                        field.onChange(d);
                        onReportDateChange(d);
                      }}
                    />
                  )}
                />
                <TextInput
                  label="Geçerlilik tarihi (Valid Until)"
                  value={watch('validUntil') || validUntilAuto}
                  readOnly
                  description="Firma tehlike sınıfına göre otomatik hesaplanır"
                />
              </Stack>
            </Tabs.Panel>

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
                  value={watch('anamnesis.chronicIllnesses') || ''}
                  onChange={(e) => setValue('anamnesis.chronicIllnesses', e.currentTarget.value)}
                  minRows={2}
                />
                <Textarea
                  label={t('health.examination.form.pastSurgeries')}
                  placeholder={t('health.examination.form.pastSurgeriesPlaceholder')}
                  value={watch('anamnesis.surgeries') || ''}
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
                  <NumberInput
                    label={t('health.examination.form.bmi')}
                    value={bmi}
                    readOnly
                    disabled
                    placeholder="—"
                  />
                </Group>
                <Group grow>
                  <Controller
                    name="physical.bloodPressure"
                    control={control}
                    render={({ field }) => (
                      <TextInput
                        label={t('health.examination.form.bloodPressure')}
                        placeholder="120/80"
                        value={field.value || ''}
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
                    value={watch('physical.vision') || null}
                    onChange={(v) => setValue('physical.vision', (v as Physical['vision']) ?? 'Normal')}
                  />
                  <Select
                    label={t('health.examination.form.hearing')}
                    data={PHYSICAL_FINDING_OPTIONS}
                    value={watch('physical.hearing') || null}
                    onChange={(v) => setValue('physical.hearing', (v as Physical['hearing']) ?? 'Normal')}
                  />
                </Group>
                <Text size="sm" fw={500} mt="md">Laboratuvar (opsiyonel)</Text>
                <Textarea
                  label={t('health.examination.form.bloodValues')}
                  placeholder={t('health.examination.form.bloodValuesPlaceholder')}
                  value={watch('labs.bloodAnalysis') || ''}
                  onChange={(e) => setValue('labs.bloodAnalysis', e.currentTarget.value)}
                  minRows={1}
                />
                <Textarea
                  label={t('health.examination.form.audiometry')}
                  placeholder={t('health.examination.form.audiometryPlaceholder')}
                  value={watch('labs.audiometry') || ''}
                  onChange={(e) => setValue('labs.audiometry', e.currentTarget.value)}
                  minRows={1}
                />
                <Textarea
                  label={t('health.examination.form.chestXRay')}
                  placeholder={t('health.examination.form.chestXRayPlaceholder')}
                  value={watch('labs.lungXray') || ''}
                  onChange={(e) => setValue('labs.lungXray', e.currentTarget.value)}
                  minRows={1}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="conclusion" pt="md">
              <Stack gap="md">
                <Select
                  label={t('health.examination.form.conclusion')}
                  data={RESULT_OPTIONS}
                  value={watch('conclusion.result') || null}
                  onChange={(v) => setValue('conclusion.result', (v as Conclusion['result']) ?? 'Elverişli')}
                />
                <Controller
                  name="conclusion.nextExamDate"
                  control={control}
                  render={({ field }) => {
                    const val = field.value;
                    const dateVal =
                      typeof val === 'string'
                        ? val
                          ? new Date(val)
                          : null
                        : val
                          ? new Date(val as string)
                          : null;
                    return (
                      <DatePickerInput
                        label={t('health.examination.form.nextExaminationDate')}
                        placeholder={t('health.examination.form.nextExaminationDatePlaceholder')}
                        valueFormat="DD.MM.YYYY"
                        value={dateVal}
                        onChange={(d) =>
                          setValue(
                            'conclusion.nextExamDate',
                            d ? new Date(d).toISOString().slice(0, 10) : ''
                          )
                        }
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
                      value={field.value || ''}
                      onChange={field.onChange}
                      minRows={2}
                    />
                  )}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="ibys" pt="md">
              <Stack gap="md">
                <Text size="sm" fw={500}>
                  İBYS gönderimi için zorunlu alanlar
                </Text>
                {ibysErrors.length > 0 ? (
                  <Alert color="orange" title="Eksik alanlar">
                    İBYS gönderimi için şu alanlar eksik:
                    <List size="sm" mt="xs">
                      {ibysErrors.map((err) => (
                        <List.Item key={err}>{err}</List.Item>
                      ))}
                    </List>
                  </Alert>
                ) : (
                  <Alert color="green" title="Tamamlandı">
                    Tüm zorunlu alanlar dolduruldu. İBYS'ye gönderim yapılabilir.
                  </Alert>
                )}
                <Button type="submit" fullWidth>
                  Kaydet ve Tamamla
                </Button>
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Group justify="flex-end" mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
            <Button variant="default" type="button" onClick={onClose}>
              {t('company.back')}
            </Button>
            <Button type="submit">
              {existingExam ? 'Güncelle' : t('health.examination.saveExamination')}
            </Button>
          </Group>
        </form>
      </Modal>

      <Modal opened={quickAddOpened} onClose={closeQuickAdd} title="Hızlı Çalışan Ekle" size="sm">
        <QuickAddWorkerForm onSubmit={handleQuickAddSubmit} companyOptions={companyOptions} />
      </Modal>
    </>
  );
}

function QuickAddWorkerForm({
  onSubmit,
  companyOptions,
}: {
  onSubmit: (data: WorkerFormValues) => void;
  companyOptions: { value: string; label: string }[];
}) {
  const { handleSubmit, register, setValue, watch } = useForm<WorkerFormValues>({
    defaultValues: {
      nameSurname: '',
      idNumber: '',
      email: '',
      jobTitle: '',
      companyId: undefined,
    },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="sm">
        <TextInput label="Ad Soyad" placeholder="Ad Soyad" required {...register('nameSurname')} />
        <TextInput label="TC Kimlik No" placeholder="11 hane" {...register('idNumber')} />
        <TextInput label="E-posta" type="email" placeholder="email@ornek.com" {...register('email')} />
        <Select
          label="Firma"
          data={companyOptions}
          value={watch('companyId') ?? null}
          onChange={(v) => setValue('companyId', v ?? undefined)}
          clearable
        />
        <TextInput label="Ünvan" placeholder="Ünvan" {...register('jobTitle')} />
        <Group justify="flex-end" mt="md">
          <Button type="submit">Ekle</Button>
        </Group>
      </Stack>
    </form>
  );
}
