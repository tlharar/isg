import { useEffect } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  SimpleGrid,
  Text,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useTranslation } from '@shared/i18n';
import { useSubContractorStore, type SubContractor } from '@store/subContractorStore';

interface SubContractorModalProps {
  opened: boolean;
  onClose: () => void;
  mainCompanyId: string;
  editSubContractor?: SubContractor | null;
}

interface SubContractorFormValues {
  name: string;
  sgkNumber: string;
  taxNumber: string;
  taxOffice: string;
  authorizedPerson: string;
  phone: string;
  email: string;
  contractStartDate: Date | null;
  contractEndDate: Date | null;
  workDescription: string;
}

function toDate(d: Date | string | undefined): Date | null {
  if (!d) return null;
  const parsed = d instanceof Date ? d : new Date(d);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function SubContractorModal({
  opened,
  onClose,
  mainCompanyId,
  editSubContractor,
}: SubContractorModalProps) {
  const { t } = useTranslation();
  const addSubContractor = useSubContractorStore((s) => s.addSubContractor);
  const updateSubContractor = useSubContractorStore((s) => s.updateSubContractor);

  const form = useForm<SubContractorFormValues>({
    initialValues: {
      name: '',
      sgkNumber: '',
      taxNumber: '',
      taxOffice: '',
      authorizedPerson: '',
      phone: '',
      email: '',
      contractStartDate: null,
      contractEndDate: null,
      workDescription: '',
    },
    validate: {
      name: (value) => (!value?.trim() ? t('subcontractors.validation.nameRequired') : null),
      sgkNumber: (value) => (!value?.trim() ? t('subcontractors.validation.sgkRequired') : null),
      contractStartDate: (value) => (!value ? t('subcontractors.validation.startDateRequired') : null),
      contractEndDate: (value) => (!value ? t('subcontractors.validation.endDateRequired') : null),
    },
  });

  useEffect(() => {
    if (editSubContractor && opened) {
      form.setValues({
        name: editSubContractor.name ?? '',
        sgkNumber: editSubContractor.sgkNumber ?? '',
        taxNumber: (editSubContractor as Partial<SubContractor>).taxNumber ?? '',
        taxOffice: (editSubContractor as Partial<SubContractor>).taxOffice ?? '',
        authorizedPerson: (editSubContractor as Partial<SubContractor>).authorizedPerson ?? '',
        phone: (editSubContractor as Partial<SubContractor>).phone ?? '',
        email: (editSubContractor as Partial<SubContractor>).email ?? '',
        contractStartDate: toDate(editSubContractor.contractStartDate),
        contractEndDate: toDate(editSubContractor.contractEndDate),
        workDescription: editSubContractor.workDescription ?? '',
      });
    } else if (!editSubContractor) {
      form.reset();
    }
  }, [editSubContractor, opened]);

  const handleSubmit = (values: SubContractorFormValues) => {
    if (!values.contractStartDate || !values.contractEndDate) return;
    const payload = {
      name: values.name.trim(),
      sgkNumber: values.sgkNumber.trim(),
      taxNumber: values.taxNumber.trim(),
      taxOffice: values.taxOffice.trim(),
      authorizedPerson: values.authorizedPerson.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      contractStartDate: values.contractStartDate,
      contractEndDate: values.contractEndDate,
      workDescription: values.workDescription.trim(),
    };
    if (editSubContractor) {
      updateSubContractor(editSubContractor.id, payload);
    } else {
      addSubContractor({
        mainCompanyId,
        ...payload,
      });
    }
    form.reset();
    onClose();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={editSubContractor ? t('subcontractors.modal.editTitle') : t('subcontractors.modal.addTitle')}
      size="lg"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          {/* Section 1: Firma Bilgileri */}
          <Stack gap="xs">
            <Text size="sm" fw={600} c="dimmed">
              {t('subcontractors.sectionFirma')}
            </Text>
            <TextInput
              label={t('subcontractors.form.name')}
              placeholder={t('subcontractors.form.namePlaceholder')}
              required
              {...form.getInputProps('name')}
            />
            <SimpleGrid cols={2}>
              <TextInput
                label={t('subcontractors.form.sgkNumber')}
                placeholder={t('subcontractors.form.sgkNumberPlaceholder')}
                required
                {...form.getInputProps('sgkNumber')}
              />
              <TextInput
                label={t('subcontractors.form.taxNumber')}
                {...form.getInputProps('taxNumber')}
              />
              <TextInput
                label={t('subcontractors.form.taxOffice')}
                {...form.getInputProps('taxOffice')}
              />
            </SimpleGrid>
          </Stack>

          {/* Section 2: İletişim */}
          <Stack gap="xs">
            <Text size="sm" fw={600} c="dimmed">
              {t('subcontractors.sectionContact')}
            </Text>
            <SimpleGrid cols={2}>
              <TextInput
                label={t('subcontractors.form.authorizedPerson')}
                {...form.getInputProps('authorizedPerson')}
              />
              <TextInput
                label={t('subcontractors.form.phone')}
                type="tel"
                {...form.getInputProps('phone')}
              />
              <TextInput
                label={t('subcontractors.form.email')}
                type="email"
                {...form.getInputProps('email')}
              />
            </SimpleGrid>
          </Stack>

          {/* Section 3: Sözleşme Detayları */}
          <Stack gap="xs">
            <Text size="sm" fw={600} c="dimmed">
              {t('subcontractors.sectionContract')}
            </Text>
            <SimpleGrid cols={2}>
              <DatePickerInput
                label={t('subcontractors.form.contractStartDate')}
                placeholder={t('subcontractors.form.contractStartDatePlaceholder')}
                valueFormat="DD.MM.YYYY"
                required
                {...form.getInputProps('contractStartDate')}
              />
              <DatePickerInput
                label={t('subcontractors.form.contractEndDate')}
                placeholder={t('subcontractors.form.contractEndDatePlaceholder')}
                valueFormat="DD.MM.YYYY"
                required
                {...form.getInputProps('contractEndDate')}
              />
            </SimpleGrid>
            <Textarea
              label={t('subcontractors.form.workDescription')}
              placeholder={t('subcontractors.form.workDescriptionPlaceholder')}
              minRows={3}
              {...form.getInputProps('workDescription')}
            />
          </Stack>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" color="teal">
              {editSubContractor ? t('common.save') : t('common.add')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
