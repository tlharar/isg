import { useEffect, useMemo } from 'react';
import { Modal, Select, Button, Group, Stack } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useTranslation } from '@shared/i18n';
import { useRepresentativeStore, type SelectionMethod } from '@store/representativeStore';
import { useWorkerStore } from '@store/workerStore';

interface RepresentativeModalProps {
  opened: boolean;
  onClose: () => void;
  companyId: string;
  editRepresentativeId?: string | null;
}

interface RepresentativeFormValues {
  employeeId: string;
  selectionMethod: SelectionMethod;
  selectionDate: Date | null;
  validUntil: Date | null;
}

// Mock employee options when no workers in store (fallback)
const MOCK_EMPLOYEE_OPTIONS = [
  { value: 'emp-mock-1', label: 'Ahmet Yılmaz - Kaynakçı' },
  { value: 'emp-mock-2', label: 'Mehmet Demir - Montaj Ustası' },
  { value: 'emp-mock-3', label: 'Ayşe Kaya - Kalite Kontrol' },
  { value: 'emp-mock-4', label: 'Fatma Şahin - İdari İşler' },
  { value: 'emp-mock-5', label: 'Ali Çelik - Üretim Sorumlusu' },
];

export function RepresentativeModal({
  opened,
  onClose,
  companyId,
  editRepresentativeId,
}: RepresentativeModalProps) {
  const { t } = useTranslation();
  const addRepresentative = useRepresentativeStore((s) => s.addRepresentative);
  const updateRepresentative = useRepresentativeStore((s) => s.updateRepresentative);
  const getRepresentativeById = useRepresentativeStore((s) => s.getRepresentativeById);
  const workers = useWorkerStore((s) => s.workers);

  const form = useForm<RepresentativeFormValues>({
    initialValues: {
      employeeId: '',
      selectionMethod: 'Seçim',
      selectionDate: null,
      validUntil: null,
    },
    validate: {
      employeeId: (value) => (!value ? t('representatives.validation.employeeRequired') : null),
      selectionMethod: (value) => (!value ? t('representatives.validation.methodRequired') : null),
      selectionDate: (value) => (!value ? t('representatives.validation.selectionDateRequired') : null),
    },
  });

  // Build employee options from workers (company-filtered) or mock
  const employeeOptions = useMemo(() => {
    const companyWorkers = workers.filter((w) => w.companyId === companyId);
    if (companyWorkers.length > 0) {
      return companyWorkers.map((w) => ({
        value: w.id,
        label: `${w.nameSurname}${w.jobTitle ? ` - ${w.jobTitle}` : ''}`,
      }));
    }
    return MOCK_EMPLOYEE_OPTIONS;
  }, [workers, companyId]);

  // Helper to get employee name and job from selection
  const getEmployeeDisplay = (empId: string) => {
    const worker = workers.find((w) => w.id === empId);
    if (worker) return { name: worker.nameSurname, job: worker.jobTitle ?? '' };
    const mock = MOCK_EMPLOYEE_OPTIONS.find((o) => o.value === empId);
    if (mock) {
      const parts = mock.label.split(' - ');
      return { name: parts[0], job: parts[1] ?? '' };
    }
    return { name: empId, job: '' };
  };

  useEffect(() => {
    if (editRepresentativeId && opened) {
      const rep = getRepresentativeById(editRepresentativeId);
      if (rep) {
        form.setValues({
          employeeId: rep.employeeId,
          selectionMethod: rep.selectionMethod,
          selectionDate: new Date(rep.selectionDate),
          validUntil: new Date(rep.validUntil),
        });
      }
    } else if (!editRepresentativeId) {
      form.reset();
    }
  }, [editRepresentativeId, opened]);

  const handleSubmit = (values: RepresentativeFormValues) => {
    if (!values.selectionDate) return;
    const { name, job } = getEmployeeDisplay(values.employeeId);
    const validUntil = values.validUntil ?? (() => {
      const d = new Date(values.selectionDate!);
      d.setFullYear(d.getFullYear() + 5);
      return d;
    })();

    if (editRepresentativeId) {
      updateRepresentative(editRepresentativeId, {
        employeeId: values.employeeId,
        employeeName: name,
        jobTitle: job || undefined,
        selectionMethod: values.selectionMethod,
        selectionDate: values.selectionDate,
        validUntil,
      });
    } else {
      addRepresentative({
        companyId,
        employeeId: values.employeeId,
        employeeName: name,
        jobTitle: job || undefined,
        selectionMethod: values.selectionMethod,
        selectionDate: values.selectionDate,
        validUntil,
      });
    }
    form.reset();
    onClose();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const methodOptions = [
    { value: 'Seçim', label: t('representatives.methodElection') },
    { value: 'Atama', label: t('representatives.methodAssignment') },
  ];

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={editRepresentativeId ? t('representatives.modal.editTitle') : t('representatives.modal.addTitle')}
      size="lg"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Select
            label={t('representatives.form.employee')}
            placeholder={t('representatives.form.employeePlaceholder')}
            data={employeeOptions}
            searchable
            required
            {...form.getInputProps('employeeId')}
          />
          <Select
            label={t('representatives.form.selectionMethod')}
            placeholder={t('representatives.form.selectionMethodPlaceholder')}
            data={methodOptions}
            required
            {...form.getInputProps('selectionMethod')}
          />
          <DatePickerInput
            label={t('representatives.form.selectionDate')}
            placeholder={t('representatives.form.selectionDatePlaceholder')}
            valueFormat="DD.MM.YYYY"
            required
            {...form.getInputProps('selectionDate')}
          />
          <DatePickerInput
            label={t('representatives.form.validUntil')}
            placeholder={t('representatives.form.validUntilPlaceholder')}
            valueFormat="DD.MM.YYYY"
            {...form.getInputProps('validUntil')}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" color="teal">
              {editRepresentativeId ? t('common.save') : t('common.add')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
