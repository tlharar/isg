import { useEffect, useMemo } from 'react';
import {
  Modal,
  TextInput,
  Select,
  MultiSelect,
  NumberInput,
  Button,
  Stack,
  Group,
  Textarea,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useTranslation } from '@shared/i18n';
import { useEducationStore } from '@store/educationStore';
import { useWorkerStore } from '@store/workerStore';
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
  description?: string;
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

export function EducationModal({ opened, onClose, onSubmit, initialValues, title }: EducationModalProps) {
  const { t } = useTranslation();
  const workers = useWorkerStore((s) => s.workers);
  const templates = useEducationStore((s) => s.templates);
  const getTemplateById = useEducationStore((s) => s.getTemplateById);

  const attendeeOptions = useMemo(
    () => workers.map((w) => ({ value: w.id, label: w.nameSurname })),
    [workers]
  );

  const templateSelectOptions = useMemo(
    () =>
      templates.map((tmpl) => ({
        value: tmpl.id,
        label: tmpl.name,
      })),
    [templates]
  );

  const form = useForm<EducationFormValues>({
    initialValues: {
      title: '',
      type: 'Temel Eğitim',
      trainer: '',
      date: new Date(),
      validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      durationHours: 8,
      location: '',
      attendees: [],
      status: 'Planlandı',
      description: '',
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
        durationHours: initialValues?.durationHours ?? 8,
        location: initialValues?.location || '',
        attendees: initialValues?.attendees ?? [],
        status: initialValues?.status || 'Planlandı',
        description: initialValues?.description ?? '',
      });
    }
  }, [opened, initialValues]);

  const handleTemplateChange = (templateId: string | null) => {
    if (!templateId) return;
    const template = getTemplateById(templateId);
    if (!template) return;
    const updates: Partial<EducationFormValues> = {};
    if (template.subject != null && template.subject !== '') {
      updates.title = template.subject;
    } else if (template.name) {
      updates.title = template.name;
    }
    if (template.type != null) updates.type = template.type;
    if (template.durationHours != null) updates.durationHours = template.durationHours;
    if (template.validityYears != null) {
      const d = new Date();
      d.setFullYear(d.getFullYear() + template.validityYears);
      updates.validUntil = d;
    }
    if (template.description != null) updates.description = template.description;
    if (Object.keys(updates).length > 0) {
      form.setValues(updates);
    }
  };

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
          {/* Template selector - only when adding new (no initialValues) */}
          {!initialValues && (
            <Select
              label={t('education.form.fillFromTemplate')}
              placeholder={t('education.form.selectTemplate')}
              data={templateSelectOptions}
              clearable
              onChange={handleTemplateChange}
            />
          )}

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

          {/* Katılımcılar (MultiSelect) */}
          <MultiSelect
            label={t('education.form.attendees')}
            placeholder={t('education.form.selectAttendees')}
            data={attendeeOptions}
            required
            searchable
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

          {/* Description (optional) */}
          <Textarea
            label={t('education.form.description')}
            placeholder={t('education.form.descriptionPlaceholder')}
            minRows={2}
            {...form.getInputProps('description')}
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
