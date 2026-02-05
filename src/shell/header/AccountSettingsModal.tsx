import { Modal, Stack, TextInput, Button, Group, Alert, Text } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useTranslation } from '@shared/i18n';
import { useAuthStore, type UserRole } from '@shared/stores/authStore';

function getRoleLabel(role: UserRole, t: (key: string) => string): string {
  const key = `shell.roles.${role}`;
  const translated = t(key);
  return translated !== key ? translated : role;
}

interface AccountSettingsModalProps {
  opened: boolean;
  onClose: () => void;
}

export function AccountSettingsModal({ opened, onClose }: AccountSettingsModalProps) {
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.currentUser);

  const roleLabel = currentUser ? getRoleLabel(currentUser.role, t) : '—';

  return (
    <Modal opened={opened} onClose={onClose} title={t('shell.accountInfo')} size="sm" centered>
      <Stack gap="sm">
        <TextInput
          label={t('shell.firstName')}
          value={currentUser?.firstName ?? ''}
          readOnly
          variant="filled"
        />
        <TextInput
          label={t('shell.lastName')}
          value={currentUser?.lastName ?? ''}
          readOnly
          variant="filled"
        />
        <TextInput
          label={t('shell.email')}
          value={currentUser?.email ?? ''}
          readOnly
          variant="filled"
        />
        <TextInput
          label={t('shell.phone')}
          value={currentUser?.phone ?? '—'}
          readOnly
          variant="filled"
        />
        <TextInput
          label={t('shell.role')}
          value={roleLabel}
          readOnly
          variant="filled"
        />

        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" mt="sm">
          <Text size="sm">{t('shell.accountContactAdmin')}</Text>
        </Alert>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            {t('common.close')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
