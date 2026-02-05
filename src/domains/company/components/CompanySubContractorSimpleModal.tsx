import { Modal, TextInput, Button, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from '@shared/i18n';
import { useCompanyStore, type SubContractorInput } from '@store/companyStore';

interface CompanySubContractorSimpleModalProps {
  opened: boolean;
  onClose: () => void;
  companyId: string;
}

export function CompanySubContractorSimpleModal({
  opened,
  onClose,
  companyId,
}: CompanySubContractorSimpleModalProps) {
  const { t } = useTranslation();
  const addSubContractor = useCompanyStore((s) => s.addSubContractor);

  const form = useForm<SubContractorInput>({
    initialValues: {
      name: '',
      sgkNumber: '',
      contactPerson: '',
    },
    validate: {
      name: (value) => (!value?.trim() ? t('subcontractors.validation.nameRequired') : null),
      sgkNumber: (value) => (!value?.trim() ? t('subcontractors.validation.sgkRequired') : null),
    },
  });

  const handleSubmit = (values: SubContractorInput) => {
    addSubContractor(companyId, {
      name: values.name.trim(),
      sgkNumber: values.sgkNumber.trim(),
      contactPerson: (values.contactPerson ?? '').trim(),
    });
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
      title={t('subcontractors.modal.addTitle')}
      size="sm"
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
          <TextInput
            label={t('subcontractors.form.contactPerson')}
            placeholder={t('subcontractors.form.contactPersonPlaceholder')}
            {...form.getInputProps('contactPerson')}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" type="button" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" color="teal">
              {t('common.add')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
