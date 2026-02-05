import { useEffect, useMemo } from 'react';
import {
  Modal,
  Stack,
  Select,
  NumberInput,
  TextInput,
  Textarea,
  Button,
  Group,
  Switch,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useWorkerStore } from '@store/workerStore';
import { useAppStore } from '@shared/stores/appStore';
import {
  useVaccineStore,
  getSuggestedNextDoseDate,
  type VaccineRecord,
  type VaccineType,
  type VaccineStatus,
} from '../stores/vaccineStore';

const VACCINE_TYPE_OPTIONS: { value: VaccineType; label: string }[] = [
  { value: 'TETANUS', label: 'Tetanoz' },
  { value: 'HEPATITIS_B', label: 'Hepatit B' },
  { value: 'INFLUENZA', label: 'Grip (İnfluenza)' },
  { value: 'COVID19', label: 'COVID-19' },
  { value: 'OTHER', label: 'Diğer' },
];

const STATUS_OPTIONS: { value: VaccineStatus; label: string }[] = [
  { value: 'PENDING', label: 'Bekliyor' },
  { value: 'COMPLETED', label: 'Tamamlandı' },
  { value: 'REFUSED', label: 'Reddetti' },
];

interface VaccineModalProps {
  opened: boolean;
  onClose: () => void;
  record: VaccineRecord | null;
  preselectedWorkerId?: string | null;
  onSaved?: () => void;
}

export function VaccineModal({
  opened,
  onClose,
  record,
  preselectedWorkerId,
  onSaved,
}: VaccineModalProps) {
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const workers = useWorkerStore((s) => s.workers);
  const addVaccine = useVaccineStore((s) => s.addVaccine);
  const updateVaccine = useVaccineStore((s) => s.updateVaccine);

  const workerOptions = workers
    .filter((w) => !selectedCompanyId || w.companyId === selectedCompanyId)
    .map((w) => ({ value: w.id, label: w.nameSurname }));

  const form = useForm({
    initialValues: {
      workerId: '',
      vaccineType: 'TETANUS' as VaccineType,
      doseNumber: 1,
      isBooster: false,
      applicationDate: null as Date | null,
      nextDoseDate: null as Date | null,
      status: 'COMPLETED' as VaccineStatus,
      batchNumber: '',
      administeredBy: '',
      location: '',
      notes: '',
    },
    validate: {
      workerId: (v) => (!v ? 'Personel seçin' : null),
      applicationDate: (v) => (!v ? 'İşlem tarihi seçin' : null),
      notes: (v, values) =>
        values.status === 'REFUSED' && !v?.trim() ? 'Red gerekçesi yazın' : null,
    },
  });

  const isRefused = form.values.status === 'REFUSED';

  const suggestedNext = useMemo(() => {
    const appDate = form.values.applicationDate;
    if (!appDate) return null;
    return getSuggestedNextDoseDate(
      form.values.vaccineType,
      form.values.doseNumber,
      appDate
    );
  }, [form.values.vaccineType, form.values.doseNumber, form.values.applicationDate]);

  useEffect(() => {
    if (opened) {
      if (record) {
        const appDate = record.applicationDate instanceof Date ? record.applicationDate : new Date(record.applicationDate);
        const nextDate = record.nextDoseDate
          ? (record.nextDoseDate instanceof Date ? record.nextDoseDate : new Date(record.nextDoseDate))
          : null;
        form.setValues({
          workerId: record.workerId,
          vaccineType: record.vaccineType,
          doseNumber: record.doseNumber,
          isBooster: record.isBooster,
          applicationDate: appDate,
          nextDoseDate: nextDate,
          status: record.status,
          batchNumber: record.batchNumber ?? '',
          administeredBy: record.administeredBy ?? '',
          location: record.location ?? '',
          notes: record.notes ?? '',
        });
      } else {
        form.setValues({
          workerId: preselectedWorkerId ?? '',
          vaccineType: 'TETANUS',
          doseNumber: 1,
          isBooster: false,
          applicationDate: new Date(),
          nextDoseDate: null,
          status: 'COMPLETED',
          batchNumber: '',
          administeredBy: '',
          location: '',
          notes: '',
        });
      }
    }
  }, [opened, record, preselectedWorkerId]);

  useEffect(() => {
    if (suggestedNext && !record && form.values.applicationDate && !form.values.nextDoseDate) {
      form.setFieldValue('nextDoseDate', suggestedNext);
    }
  }, [suggestedNext?.getTime(), record]);

  const handleSubmit = form.onSubmit((values) => {
    if (!values.applicationDate) return;
    const payload = {
      workerId: values.workerId,
      vaccineType: values.vaccineType,
      doseNumber: values.doseNumber,
      isBooster: values.isBooster,
      applicationDate: values.applicationDate,
      nextDoseDate: isRefused ? null : values.nextDoseDate,
      status: values.status,
      batchNumber: isRefused ? '' : values.batchNumber,
      administeredBy: values.administeredBy,
      location: values.location,
      notes: values.notes.trim(),
    };
    if (record) {
      updateVaccine(record.id, payload);
    } else {
      addVaccine(payload);
    }
    form.reset();
    onClose();
    onSaved?.();
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const applySuggestion = () => {
    if (suggestedNext) form.setFieldValue('nextDoseDate', suggestedNext);
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={record ? 'Aşı Kaydı Düzenle' : 'Yeni Aşı Kaydı'}
      size="md"
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Select
            label="Personel"
            placeholder="Personel seçin"
            data={workerOptions}
            searchable
            nothingFoundMessage="Personel bulunamadı"
            {...form.getInputProps('workerId')}
          />

          <Select
            label="Aşı Tipi"
            data={VACCINE_TYPE_OPTIONS}
            {...form.getInputProps('vaccineType')}
          />

          <Group grow>
            <NumberInput
              label="Doz No"
              min={1}
              max={10}
              {...form.getInputProps('doseNumber')}
            />
            <Switch
              label="Rapel mi?"
              {...form.getInputProps('isBooster', { type: 'checkbox' })}
            />
          </Group>

          <Switch
            label="Personel aşıyı reddetti"
            description="İşaretlenirse partino ve gelecek doz alanları gizlenir, gerekçe zorunludur."
            checked={isRefused}
            onChange={(e) => {
              form.setFieldValue('status', e.currentTarget.checked ? 'REFUSED' : 'COMPLETED');
              if (e.currentTarget.checked) {
                form.setFieldValue('nextDoseDate', null);
                form.setFieldValue('batchNumber', '');
              }
            }}
          />

          {!isRefused && (
            <>
              <Select
                label="Durum"
                data={STATUS_OPTIONS}
                {...form.getInputProps('status')}
              />
              <DatePickerInput
                label="İşlem Tarihi (Yapılma Tarihi)"
                valueFormat="DD.MM.YYYY"
                {...form.getInputProps('applicationDate')}
              />
              <Group align="flex-end">
                <DatePickerInput
                  label="Bir Sonraki Doz Tarihi"
                  valueFormat="DD.MM.YYYY"
                  placeholder="Opsiyonel"
                  clearable
                  style={{ flex: 1 }}
                  {...form.getInputProps('nextDoseDate')}
                />
                {suggestedNext && (
                  <Button variant="light" size="sm" onClick={applySuggestion}>
                    Öneriyi Uygula
                  </Button>
                )}
              </Group>
              <TextInput
                label="Parti / Seri No"
                placeholder="Parti no"
                {...form.getInputProps('batchNumber')}
              />
            </>
          )}

          {isRefused && (
            <DatePickerInput
              label="İşlem Tarihi"
              valueFormat="DD.MM.YYYY"
              {...form.getInputProps('applicationDate')}
            />
          )}

          <TextInput
            label="Uygulayan Kişi"
            placeholder="Ad soyad"
            {...form.getInputProps('administeredBy')}
          />
          <TextInput
            label="Uygulama Bölgesi"
            placeholder="Örn: Sol kol"
            {...form.getInputProps('location')}
          />
          <Textarea
            label="Notlar"
            placeholder={isRefused ? 'Red gerekçesi (zorunlu)' : 'Opsiyonel not'}
            minRows={2}
            {...form.getInputProps('notes')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" type="button" onClick={handleClose}>
              İptal
            </Button>
            <Button type="submit">{record ? 'Güncelle' : 'Kaydet'}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
