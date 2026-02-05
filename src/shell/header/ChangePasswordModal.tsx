import { useState } from 'react';
import { Modal, Stack, PasswordInput, Button, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from '@shared/i18n';
import { useAuthStore } from '@shared/stores/authStore';

interface ChangePasswordModalProps {
  opened: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ opened, onClose }: ChangePasswordModalProps) {
  const { t } = useTranslation();
  const changePassword = useAuthStore((s) => s.changePassword);
  const currentUser = useAuthStore((s) => s.currentUser);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  const handleSubmit = () => {
    setError('');
    if (!newPassword.trim()) {
      setError(t('shell.passwordErrorEnterNew'));
      return;
    }
    if (newPassword.length < 4) {
      setError(t('shell.passwordErrorMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('shell.passwordErrorNoMatch'));
      return;
    }
    if (currentUser && currentPassword && currentUser.password !== currentPassword) {
      setError(t('shell.passwordErrorWrongCurrent'));
      return;
    }
    if (!changePassword(newPassword)) {
      setError(t('shell.passwordErrorUpdateFailed'));
      return;
    }
    notifications.show({
      title: t('shell.passwordChanged'),
      message: t('shell.passwordChangedMessage'),
      color: 'green',
    });
    handleClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title={t('shell.changePassword')} size="sm" centered>
      <Stack gap="sm">
        <PasswordInput
          label={t('shell.currentPassword')}
          placeholder={t('shell.currentPasswordPlaceholder')}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <PasswordInput
          label={t('shell.newPassword')}
          placeholder={t('shell.newPasswordPlaceholder')}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <PasswordInput
          label={t('shell.confirmPassword')}
          placeholder={t('shell.confirmPasswordPlaceholder')}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          error={
            confirmPassword && newPassword !== confirmPassword
              ? t('shell.passwordsDoNotMatch')
              : undefined
          }
        />
        {error && (
          <span style={{ fontSize: 'var(--mantine-font-size-sm)', color: 'var(--mantine-color-red-6)' }}>
            {error}
          </span>
        )}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit}>{t('common.save')}</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
