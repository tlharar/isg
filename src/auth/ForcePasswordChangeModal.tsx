import { useState } from 'react';
import { Modal, PasswordInput, Button, Stack, Text } from '@mantine/core';
import { useAuthStore } from '@shared/stores/authStore';

export interface ForcePasswordChangeModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ForcePasswordChangeModal({ opened, onClose, onSuccess }: ForcePasswordChangeModalProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!currentUser?.id) return;
    if (!newPassword.trim()) {
      setError('Yeni şifre girin.');
      return;
    }
    if (newPassword.length < 4) {
      setError('Şifre en az 4 karakter olmalı.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    const ok = updatePassword(currentUser.id, newPassword.trim());
    if (ok) {
      setNewPassword('');
      setConfirmPassword('');
      onSuccess();
      onClose();
    } else {
      setError('Şifre güncellenemedi.');
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Şifrenizi Değiştirin"
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
    >
      <Text size="sm" c="dimmed" mb="md">
        İlk girişinizde şifrenizi değiştirmeniz gerekmektedir.
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <PasswordInput
            label="Yeni Şifre"
            placeholder="Yeni şifrenizi girin"
            value={newPassword}
            onChange={(e) => setNewPassword(e.currentTarget.value)}
            required
            minLength={4}
            autoComplete="new-password"
          />
          <PasswordInput
            label="Yeni Şifre (Tekrar)"
            placeholder="Yeni şifrenizi tekrar girin"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.currentTarget.value)}
            required
            minLength={4}
            autoComplete="new-password"
          />
          {error && (
            <Text size="sm" c="red">
              {error}
            </Text>
          )}
          <Button type="submit">Şifreyi Kaydet</Button>
        </Stack>
      </form>
    </Modal>
  );
}
