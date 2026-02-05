import { useEffect, useMemo } from 'react';
import {
  Modal,
  Stack,
  Select,
  NumberInput,
  Textarea,
  Button,
  Group,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useWorkerStore } from '@store/workerStore';
import { useAuthStore } from '@shared/stores/authStore';
import { useAppStore } from '@shared/stores/appStore';
import {
  useAppointmentStore,
  DEFAULT_DURATION_MINUTES,
  type Appointment,
  type AppointmentType,
  type AppointmentStatus,
} from '../stores/appointmentStore';
import { notifications } from '@mantine/notifications';
import { AppointmentConflictError } from '../stores/appointmentStore';

export const APPOINTMENT_TYPE_OPTIONS: { value: AppointmentType; label: string; color: string }[] = [
  { value: 'PERIODIC_EXAM', label: 'Periyodik Muayene', color: 'blue' },
  { value: 'JOB_ENTRY', label: 'İşe Giriş', color: 'indigo' },
  { value: 'POLYCLINIC', label: 'Poliklinik', color: 'cyan' },
  { value: 'VACCINATION', label: 'Aşı', color: 'green' },
  { value: 'OTHER', label: 'Diğer', color: 'gray' },
];

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: 'SCHEDULED', label: 'Planlandı' },
  { value: 'CHECKED_IN', label: 'Geldi' },
  { value: 'COMPLETED', label: 'Tamamlandı' },
  { value: 'CANCELLED', label: 'İptal' },
  { value: 'NO_SHOW', label: 'Gelmedi' },
];

function toTimeString(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseTimeToDate(date: Date, timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const out = new Date(date);
  out.setHours(Number.isNaN(h) ? 0 : h, Number.isNaN(m) ? 0 : m, 0, 0);
  return out;
}

interface AppointmentModalProps {
  opened: boolean;
  onClose: () => void;
  /** When set, edit mode; otherwise new appointment. */
  appointment: Appointment | null;
  /** Pre-fill start when opening from calendar slot click. */
  initialStart?: Date | null;
  onSaved?: () => void;
}

export function AppointmentModal({
  opened,
  onClose,
  appointment,
  initialStart,
  onSaved,
}: AppointmentModalProps) {
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const currentUser = useAuthStore((s) => s.currentUser);
  const users = useAuthStore((s) => s.users);
  const workers = useWorkerStore((s) => s.workers);
  const addAppointment = useAppointmentStore((s) => s.addAppointment);
  const updateAppointment = useAppointmentStore((s) => s.updateAppointment);

  const workerOptions = useMemo(
    () =>
      workers
        .filter((w) => !selectedCompanyId || w.companyId === selectedCompanyId)
        .map((w) => ({ value: w.id, label: w.nameSurname ?? w.id })),
    [workers, selectedCompanyId]
  );

  const doctorOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: `${u.firstName} ${u.lastName}`.trim() || u.email,
      })),
    [users]
  );

  const form = useForm({
    initialValues: {
      workerId: '',
      doctorId: '',
      startDate: null as Date | null,
      startTime: '09:00',
      durationMinutes: 30,
      type: 'JOB_ENTRY' as AppointmentType,
      status: 'SCHEDULED' as AppointmentStatus,
      notes: '',
    },
    validate: {
      workerId: (v: string) => (!v ? 'Personel seçin' : null),
      doctorId: (v: string) => (!v ? 'Hekim seçin' : null),
      startDate: (v: Date | null) => (!v ? 'Tarih seçin' : null),
      startTime: (v: string) => (!v ? 'Saat girin' : null),
      durationMinutes: (v: number | null) => (v == null || v < 5 ? 'En az 5 dakika' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      if (appointment) {
        const s = appointment.start instanceof Date ? appointment.start : new Date(appointment.start);
        const e = appointment.end instanceof Date ? appointment.end : new Date(appointment.end);
        const dur = Math.round((e.getTime() - s.getTime()) / (60 * 1000));
        form.setValues({
          workerId: appointment.workerId,
          doctorId: appointment.doctorId,
          startDate: s,
          startTime: toTimeString(s),
          durationMinutes: dur,
          type: appointment.type,
          status: appointment.status,
          notes: appointment.notes ?? '',
        });
      } else {
        const start = initialStart ? new Date(initialStart) : new Date();
        form.setValues({
          workerId: '',
          doctorId: currentUser?.id ?? '',
          startDate: start,
          startTime: toTimeString(start),
          durationMinutes: DEFAULT_DURATION_MINUTES['JOB_ENTRY'],
          type: 'JOB_ENTRY',
          status: 'SCHEDULED',
          notes: '',
        });
      }
    }
  }, [opened, appointment, initialStart, currentUser?.id]);

  useEffect(() => {
    if (opened && !appointment && form.values.type) {
      form.setFieldValue('durationMinutes', DEFAULT_DURATION_MINUTES[form.values.type]);
    }
  }, [form.values.type, opened, appointment]);

  const handleSubmit = form.onSubmit((values) => {
    if (!values.startDate) return;
    const start = parseTimeToDate(values.startDate, values.startTime);
    const end = new Date(start.getTime() + values.durationMinutes * 60 * 1000);
    const payload = {
      workerId: values.workerId,
      doctorId: values.doctorId,
      start,
      end,
      type: values.type,
      status: values.status,
      notes: values.notes.trim(),
    };
    try {
      if (appointment) {
        updateAppointment(appointment.id, payload);
        notifications.show({ title: 'Randevu güncellendi', message: '', color: 'green' });
      } else {
        addAppointment(payload);
        notifications.show({ title: 'Randevu eklendi', message: '', color: 'green' });
      }
      onSaved?.();
      onClose();
    } catch (err) {
      if (err instanceof AppointmentConflictError) {
        notifications.show({
          title: 'Çakışma',
          message: err.message,
          color: 'red',
        });
      } else {
        notifications.show({
          title: 'Hata',
          message: err instanceof Error ? err.message : 'Randevu kaydedilemedi.',
          color: 'red',
        });
      }
    }
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={appointment ? 'Randevu Düzenle' : 'Yeni Randevu'}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Select
            label="Personel"
            placeholder="Personel seçin"
            data={workerOptions}
            searchable
            {...form.getInputProps('workerId')}
          />
          <Select
            label="Hekim"
            placeholder="Hekim seçin"
            data={doctorOptions}
            searchable
            {...form.getInputProps('doctorId')}
          />
          <Group grow>
            <DatePickerInput
              label="Tarih"
              placeholder="Tarih seçin"
              valueFormat="DD.MM.YYYY"
              {...form.getInputProps('startDate')}
            />
            <TimeInput
              label="Başlangıç saati"
              {...form.getInputProps('startTime')}
            />
          </Group>
          <NumberInput
            label="Süre (dakika)"
            min={5}
            max={120}
            {...form.getInputProps('durationMinutes')}
          />
          <Select
            label="Randevu tipi"
            data={APPOINTMENT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            {...form.getInputProps('type')}
          />
          {appointment && (
            <Select
              label="Durum"
              data={STATUS_OPTIONS}
              {...form.getInputProps('status')}
            />
          )}
          <Textarea
            label="Notlar"
            placeholder="Opsiyonel not"
            {...form.getInputProps('notes')}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit">
              {appointment ? 'Güncelle' : 'Kaydet'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
