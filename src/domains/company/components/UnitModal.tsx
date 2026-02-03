import { useEffect } from 'react';
import { Modal, TextInput, Select, Textarea, Button, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from '@shared/i18n';
import { useUnitStore, type HazardClass } from '@store/unitStore';

interface UnitModalProps {
  opened: boolean;
  onClose: () => void;
  companyId: string;
  editUnitId?: string | null;
}

interface UnitFormValues {
  name: string;
  managerName: string;
  hazardClass: HazardClass;
  description: string;
}

export function UnitModal({ opened, onClose, companyId, editUnitId }: UnitModalProps) {
  const { t } = useTranslation();
  const addUnit = useUnitStore((s) => s.addUnit);
  const updateUnit = useUnitStore((s) => s.updateUnit);
  const getUnitById = useUnitStore((s) => s.getUnitById);

  const form = useForm<UnitFormValues>({
    initialValues: {
      name: '',
      managerName: '',
      hazardClass: 'Tehlikeli',
      description: '',
    },
    validate: {
      name: (value) => (!value.trim() ? t('units.validation.nameRequired') : null),
      managerName: (value) => (!value.trim() ? t('units.validation.managerRequired') : null),
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editUnitId && opened) {
      const unit = getUnitById(editUnitId);
      if (unit) {
        form.setValues({
          name: unit.name,
          managerName: unit.managerName,
          hazardClass: unit.hazardClass,
          description: unit.description,
        });
      }
    } else if (!editUnitId) {
      form.reset();
    }
  }, [editUnitId, opened]);

  const handleSubmit = (values: UnitFormValues) => {
    if (editUnitId) {
      // Update existing unit
      updateUnit(editUnitId, values);
    } else {
      // Add new unit
      addUnit({
        ...values,
        companyId,
        employeeCount: 0, // Default to 0, can be updated later
      });
    }
    form.reset();
    onClose();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Hazard class options
  const hazardClassOptions = [
    { value: 'Az Tehlikeli', label: t('units.hazardClass.low') },
    { value: 'Tehlikeli', label: t('units.hazardClass.medium') },
    { value: 'Çok Tehlikeli', label: t('units.hazardClass.high') },
  ];

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={editUnitId ? t('units.modal.editTitle') : t('units.modal.addTitle')}
      size="lg"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Unit Name */}
          <TextInput
            label={t('units.form.name')}
            placeholder={t('units.form.namePlaceholder')}
            required
            {...form.getInputProps('name')}
          />

          {/* Manager Name */}
          <TextInput
            label={t('units.form.manager')}
            placeholder={t('units.form.managerPlaceholder')}
            required
            {...form.getInputProps('managerName')}
          />

          {/* Hazard Class */}
          <Select
            label={t('units.form.hazardClass')}
            placeholder={t('units.form.hazardClassPlaceholder')}
            data={hazardClassOptions}
            required
            {...form.getInputProps('hazardClass')}
          />

          {/* Description */}
          <Textarea
            label={t('units.form.description')}
            placeholder={t('units.form.descriptionPlaceholder')}
            minRows={3}
            maxRows={6}
            {...form.getInputProps('description')}
          />

          {/* Actions */}
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" color="teal">
              {editUnitId ? t('common.save') : t('common.add')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
