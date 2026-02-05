import { useEffect } from 'react';
import {
  Modal,
  Stack,
  Select,
  TextInput,
  Textarea,
  NumberInput,
  Button,
  Group,
  Grid,
  Text,
  Divider,
  SegmentedControl,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useWorkerStore } from '@store/workerStore';
import { useAppStore } from '@shared/stores/appStore';
import {
  usePolyclinicStore,
  type PolyclinicRecord,
  type PolyclinicOutcome,
  type PolyclinicVitals,
} from '../stores/polyclinicStore';

const defaultVitals: PolyclinicVitals = {
  systolicBp: 0,
  diastolicBp: 0,
  pulse: 0,
  temperature: 0,
  weight: 0,
};

const OUTCOME_OPTIONS: { value: PolyclinicOutcome; label: string; color: string }[] = [
  { value: 'WORK', label: 'İşinin Başına Döndü', color: 'green' },
  { value: 'REST', label: 'İstirahat Verildi', color: 'orange' },
  { value: 'HOSPITAL', label: 'Hastaneye Sevk', color: 'red' },
  { value: 'HOME', label: 'Eve Gönderildi', color: 'gray' },
];

interface PolyclinicModalProps {
  opened: boolean;
  onClose: () => void;
  record: PolyclinicRecord | null;
  onSaved?: () => void;
}

export function PolyclinicModal({ opened, onClose, record, onSaved }: PolyclinicModalProps) {
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const workers = useWorkerStore((s) => s.workers);
  const getNextProtocolNumber = usePolyclinicStore((s) => s.getNextProtocolNumber);
  const addRecord = usePolyclinicStore((s) => s.addRecord);
  const updateRecord = usePolyclinicStore((s) => s.updateRecord);

  const workerOptions = workers
    .filter((w) => !selectedCompanyId || w.companyId === selectedCompanyId)
    .map((w) => ({ value: w.id, label: w.nameSurname }));

  const form = useForm({
    initialValues: {
      workerId: '',
      date: null as Date | null,
      complaint: '',
      systolicBp: 0,
      diastolicBp: 0,
      pulse: 0,
      temperature: 0,
      weight: 0,
      diagnosis: '',
      treatment: '',
      outcome: 'WORK' as PolyclinicOutcome,
    },
    validate: {
      workerId: (v) => (!v ? 'Personel seçin' : null),
      date: (v) => (!v ? 'Tarih seçin' : null),
      outcome: (v) => (!v ? 'Sonuç seçin' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      if (record) {
        const d = record.date instanceof Date ? record.date : new Date(record.date);
        form.setValues({
          workerId: record.workerId,
          date: d,
          complaint: record.complaint,
          systolicBp: record.vitals.systolicBp,
          diastolicBp: record.vitals.diastolicBp,
          pulse: record.vitals.pulse,
          temperature: record.vitals.temperature,
          weight: record.vitals.weight,
          diagnosis: record.diagnosis,
          treatment: record.treatment,
          outcome: record.outcome,
        });
      } else {
        form.setValues({
          workerId: '',
          date: new Date(),
          complaint: '',
          systolicBp: 0,
          diastolicBp: 0,
          pulse: 0,
          temperature: 0,
          weight: 0,
          diagnosis: '',
          treatment: '',
          outcome: 'WORK',
        });
      }
    }
  }, [opened, record]);

  const nextProtocol = opened && !record ? getNextProtocolNumber() : record?.protocolNumber ?? 0;

  const handleSubmit = form.onSubmit((values) => {
    const vitals: PolyclinicVitals = {
      systolicBp: values.systolicBp,
      diastolicBp: values.diastolicBp,
      pulse: values.pulse,
      temperature: values.temperature,
      weight: values.weight,
    };
    if (record) {
      updateRecord(record.id, {
        workerId: values.workerId,
        date: values.date!,
        complaint: values.complaint,
        vitals,
        diagnosis: values.diagnosis,
        treatment: values.treatment,
        outcome: values.outcome,
      });
    } else {
      addRecord({
        workerId: values.workerId,
        date: values.date!,
        complaint: values.complaint,
        vitals,
        diagnosis: values.diagnosis,
        treatment: values.treatment,
        outcome: values.outcome,
      });
    }
    form.reset();
    onClose();
    onSaved?.();
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={record ? 'Muayene Düzenle' : 'Yeni Muayene Ekle'}
      size="md"
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* Section 1: Patient Info */}
          <Text fw={600} size="sm" c="dimmed">
            Hasta Bilgisi
          </Text>
          <Select
            label="Personel"
            placeholder="Personel seçin"
            data={workerOptions}
            searchable
            nothingFoundMessage="Personel bulunamadı"
            {...form.getInputProps('workerId')}
          />
          {!record && nextProtocol > 0 && (
            <Text size="sm" c="dimmed">
              Protokol No: <strong>{nextProtocol}</strong>
            </Text>
          )}
          <DatePickerInput
            label="Muayene Tarihi / Saati"
            placeholder="Tarih seçin"
            valueFormat="DD.MM.YYYY"
            {...form.getInputProps('date')}
          />

          <Divider />

          {/* Section 2: Vitals */}
          <Text fw={600} size="sm" c="dimmed">
            Vital Bulgular
          </Text>
          <Grid>
            <Grid.Col span={6}>
              <NumberInput
                label="Tansiyon (Büyük)"
                min={0}
                max={300}
                {...form.getInputProps('systolicBp')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label="Tansiyon (Küçük)"
                min={0}
                max={200}
                {...form.getInputProps('diastolicBp')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput label="Nabız" min={0} max={300} {...form.getInputProps('pulse')} />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label="Ateş (°C)"
                min={30}
                max={45}
                decimalScale={1}
                {...form.getInputProps('temperature')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label="Kilo (kg)"
                min={0}
                max={300}
                decimalScale={1}
                {...form.getInputProps('weight')}
              />
            </Grid.Col>
          </Grid>

          <Divider />

          {/* Section 3: Clinical Details */}
          <Text fw={600} size="sm" c="dimmed">
            Klinik Bilgiler
          </Text>
          <Textarea
            label="Şikayet"
            placeholder="Şikayet girin"
            minRows={2}
            {...form.getInputProps('complaint')}
          />
          <TextInput
            label="Tanı"
            placeholder="Tanı"
            {...form.getInputProps('diagnosis')}
          />
          <Textarea
            label="Yapılan İşlem"
            placeholder="Yapılan işlem"
            minRows={2}
            {...form.getInputProps('treatment')}
          />

          <Divider />

          {/* Section 4: Outcome */}
          <Text fw={600} size="sm" c="dimmed">
            Sonuç
          </Text>
          <SegmentedControl
            data={OUTCOME_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            value={form.values.outcome}
            onChange={(v) => form.setFieldValue('outcome', v as PolyclinicOutcome)}
            fullWidth
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
