import { useEffect } from 'react';
import { Modal, TextInput, Select, NumberInput, Button, Stack, Group } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useTranslation } from '@shared/i18n';
import type { EducationSession, EducationType, EducationStatus } from '@store/educationStore';

interface EducationModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: EducationFormValues) => void;
  initialValues?: EducationSession | null;
  title: string;
}

export interface EducationFormValues {
  title: string;
  type: EducationType;
  trainer: string;
  date: Date;
  validUntil: Date;
  durationHours: number;
  location: string;
  attendees: string[];
  status: EducationStatus;
}

const EDUCATION_TYPE_OPTIONS = [
  { value: 'İşe Başlama', label: 'İşe Başlama' },
  { value: 'Temel Eğitim', label: 'Temel Eğitim' },
  { value: 'Mesleki Eğitim', label: 'Mesleki Eğitim' },
  { value: 'Yenileme', label: 'Yenileme' },
];

const STATUS_OPTIONS = [
  { value: 'Planlandı', label: 'Planlandı' },
  { value: 'Tamamlandı', label: 'Tamamlandı' },
  { value: 'İptal', label: 'İptal' },
];

// Mock attendees for MultiSelect (in real app, fetch from worker/employee store)
const MOCK_ATTENDEES = [
  { value: 'Ali Demir', label: 'Ali Demir' },
  { value: 'Ayşe Kaya', label: 'Ayşe Kaya' },
  { value: 'Mehmet Öz', label: 'Mehmet Öz' },
  { value: 'Fatma Yıldız', label: 'Fatma Yıldız' },
  { value: 'Can Arslan', label: 'Can Arslan' },
  { value: 'Emre Şahin', label: 'Emre Şahin' },
  { value: 'Zeynep Çelik', label: 'Zeynep Çelik' },
  { value: 'Ahmet Demir', label: 'Ahmet Demir' },
];

export function EducationModal({ opened, onClose, onSubmit, initialValues, title }: EducationModalProps) {
  const { t } = useTranslation();

  const form = useForm<EducationFormValues>({
    initialValues: {
      title: initialValues?.title || '',
      type: initialValues?.type || 'Temel Eğitim',
      trainer: initialValues?.trainer || '',
      date: initialValues?.date ? new Date(initialValues.date) : new Date(),
      validUntil: initialValues?.validUntil ? new Date(initialValues.validUntil) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      durationHours: initialValues?.durationHours || 8,
      location: initialValues?.location || '',
      attendees: initialValues?.attendees || [],
      status: initialValues?.status || 'Planlandı',
    },
    validate: {
      title: (value) => (!value.trim() ? t('education.form.titleRequired') : null),
      trainer: (value) => (!value.trim() ? t('education.form.trainerRequired') : null),
      location: (value) => (!value.trim() ? t('education.form.locationRequired') : null),
      durationHours: (value) => (value <= 0 ? t('education.form.durationInvalid') : null),
      attendees: (value) => (value.length === 0 ? t('education.form.attendeesRequired') : null),
    },
  });

  // Reset form when modal opens with new initial values
  useEffect(() => {
    if (opened) {
      form.setValues({
        title: initialValues?.title || '',
        type: initialValues?.type || 'Temel Eğitim',
        trainer: initialValues?.trainer || '',
        date: initialValues?.date ? new Date(initialValues.date) : new Date(),
        validUntil: initialValues?.validUntil ? new Date(initialValues.validUntil) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        durationHours: initialValues?.durationHours || 8,
        location: initialValues?.location || '',
        attendees: initialValues?.attendees || [],
        status: initialValues?.status || 'Planlandı',
      });
    }
  }, [opened, initialValues]);

  const handleSubmit = (values: EducationFormValues) => {
    onSubmit(values);
    form.reset();
    onClose();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title={title} size="lg" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Title */}
          <TextInput
            label={t('education.form.title')}
            placeholder={t('education.form.titlePlaceholder')}
            required
            {...form.getInputProps('title')}
          />

          {/* Type */}
          <Select
            label={t('education.form.type')}
            placeholder={t('education.form.selectType')}
            data={EDUCATION_TYPE_OPTIONS}
            required
            {...form.getInputProps('type')}
          />

          {/* Trainer */}
          <TextInput
            label={t('education.form.trainer')}
            placeholder={t('education.form.trainerPlaceholder')}
            required
            {...form.getInputProps('trainer')}
          />

          {/* Date and Duration */}
          <Group grow>
            <DatePickerInput
              label={t('education.form.date')}
              placeholder={t('education.form.selectDate')}
              required
              valueFormat="DD/MM/YYYY"
              {...form.getInputProps('date')}
            />
            <NumberInput
              label={t('education.form.duration')}
              placeholder="8"
              required
              min={0.5}
              step={0.5}
              suffix=" saat"
              {...form.getInputProps('durationHours')}
            />
          </Group>

          {/* Valid Until */}
          <DatePickerInput
            label={t('education.form.validUntil')}
            placeholder={t('education.form.selectValidUntil')}
            required
            valueFormat="DD/MM/YYYY"
            {...form.getInputProps('validUntil')}
          />

          {/* Location */}
          <TextInput
            label={t('education.form.location')}
            placeholder={t('education.form.locationPlaceholder')}
            required
            {...form.getInputProps('location')}
          />

          {/* Attendees (MultiSelect) */}
          <Select
            label={t('education.form.attendees')}
            placeholder={t('education.form.selectAttendees')}
            data={MOCK_ATTENDEES}
            required
            searchable
            multiple
            {...form.getInputProps('attendees')}
          />

          {/* Status */}
          <Select
            label={t('education.form.status')}
            placeholder={t('education.form.selectStatus')}
            data={STATUS_OPTIONS}
            required
            {...form.getInputProps('status')}
          />

          {/* Actions */}
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('common.save')}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
