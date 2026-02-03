import { useEffect } from 'react';
import { Modal, TextInput, Textarea, Button, Group, Stack } from '@mantine/core';
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
  workDescription: string;
  contractStartDate: Date | null;
  contractEndDate: Date | null;
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
      workDescription: '',
      contractStartDate: null,
      contractEndDate: null,
    },
    validate: {
      name: (value) => (!value?.trim() ? t('subcontractors.validation.nameRequired') : null),
      sgkNumber: (value) => (!value?.trim() ? t('subcontractors.validation.sgkRequired') : null),
      contractStartDate: (value) => (!value ? t('subcontractors.validation.startDateRequired') : null),
      contractEndDate: (value) => (!value ? t('subcontractors.validation.endDateRequired') : null),
    },
  });

  useEffect(() => {
    if (editSubContractor) {
      form.setValues({
        name: editSubContractor.name,
        sgkNumber: editSubContractor.sgkNumber,
        workDescription: editSubContractor.workDescription,
        contractStartDate: new Date(editSubContractor.contractStartDate),
        contractEndDate: new Date(editSubContractor.contractEndDate),
      });
    } else {
      form.reset();
    }
  }, [editSubContractor, opened]);

  const handleSubmit = (values: SubContractorFormValues) => {
    if (!values.contractStartDate || !values.contractEndDate) return;
    if (editSubContractor) {
      updateSubContractor(editSubContractor.id, {
        name: values.name.trim(),
        sgkNumber: values.sgkNumber.trim(),
        workDescription: values.workDescription.trim(),
        contractStartDate: values.contractStartDate,
        contractEndDate: values.contractEndDate,
      });
    } else {
      addSubContractor({
        mainCompanyId,
        name: values.name.trim(),
        sgkNumber: values.sgkNumber.trim(),
        workDescription: values.workDescription.trim(),
        contractStartDate: values.contractStartDate,
        contractEndDate: values.contractEndDate,
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
        <Stack gap="md">
          <TextInput
            label={t('subcontractors.form.name')}
            placeholder={t('subcontractors.form.namePlaceholder')}
            required
            {...form.getInputProps('name')}
          />
          <TextInput
            label={t('subcontractors.form.sgkNumber')}
            placeholder={t('subcontractors.form.sgkNumberPlaceholder')}
            required
            {...form.getInputProps('sgkNumber')}
          />
          <Textarea
            label={t('subcontractors.form.workDescription')}
            placeholder={t('subcontractors.form.workDescriptionPlaceholder')}
            minRows={2}
            {...form.getInputProps('workDescription')}
          />
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
