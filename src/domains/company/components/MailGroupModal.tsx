import { useEffect } from 'react';
import { Modal, TextInput, Textarea, TagsInput, Button, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useTranslation } from '@shared/i18n';
import { useMailGroupStore, type MailGroup } from '@store/mailGroupStore';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test((value || '').trim());
}

interface MailGroupModalProps {
  opened: boolean;
  onClose: () => void;
  companyId: string;
  editGroupId?: string | null;
}

interface MailGroupFormValues {
  name: string;
  description: string;
  emails: string[];
}

export function MailGroupModal({
  opened,
  onClose,
  companyId,
  editGroupId,
}: MailGroupModalProps) {
  const { t } = useTranslation();
  const addGroup = useMailGroupStore((s) => s.addGroup);
  const updateGroup = useMailGroupStore((s) => s.updateGroup);
  const getGroupById = useMailGroupStore((s) => s.getGroupById);

  const form = useForm<MailGroupFormValues>({
    initialValues: {
      name: '',
      description: '',
      emails: [],
    },
    validate: {
      name: (value) => (!(value || '').trim() ? t('mailGroups.validation.nameRequired') : null),
      emails: (value) => {
        if (!value || value.length === 0) return null;
        const invalid = value.find((e) => !isValidEmail(e));
        return invalid ? t('mailGroups.validation.emailInvalid') : null;
      },
    },
  });

  useEffect(() => {
    if (editGroupId && opened) {
      const group = getGroupById(editGroupId);
      if (group) {
        form.setValues({
          name: group.name,
          description: group.description ?? '',
          emails: [...group.emails],
        });
      }
    } else if (!editGroupId) {
      form.reset();
    }
  }, [editGroupId, opened]);

  const handleEmailsChange = (newEmails: string[]) => {
    const prevEmails = form.values.emails;
    if (newEmails.length > prevEmails.length) {
      const added = newEmails.find((e) => !prevEmails.includes(e));
      if (added && !isValidEmail(added)) {
        notifications.show({
          message: t('mailGroups.validation.emailInvalid'),
          color: 'red',
        });
        return;
      }
    }
    form.setFieldValue('emails', newEmails);
  };

  const handleSubmit = (values: MailGroupFormValues) => {
    const payload: Omit<MailGroup, 'id'> = {
      companyId,
      name: (values.name || '').trim(),
      description: (values.description || '').trim() || undefined,
      emails: (values.emails || []).map((e) => e.trim()).filter(Boolean),
    };

    if (editGroupId) {
      updateGroup(editGroupId, payload);
    } else {
      addGroup(payload);
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
      title={editGroupId ? t('mailGroups.modal.editTitle') : t('mailGroups.modal.addTitle')}
      size="lg"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label={t('mailGroups.form.name')}
            placeholder={t('mailGroups.form.namePlaceholder')}
            required
            {...form.getInputProps('name')}
          />
          <TagsInput
            label={t('mailGroups.form.emails')}
            placeholder={t('mailGroups.form.emailsPlaceholder')}
            value={form.values.emails}
            onChange={handleEmailsChange}
            splitChars={[',', ' ', ';']}
            error={form.errors.emails}
          />
          <Textarea
            label={t('mailGroups.form.description')}
            placeholder={t('mailGroups.form.descriptionPlaceholder')}
            minRows={2}
            {...form.getInputProps('description')}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" color="teal">
              {editGroupId ? t('common.save') : t('common.add')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
