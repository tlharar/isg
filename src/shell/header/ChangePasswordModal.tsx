import { useState } from 'react';
import { Modal, Stack, PasswordInput, Button, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuthStore } from '@shared/stores/authStore';

interface ChangePasswordModalProps {
  opened: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ opened, onClose }: ChangePasswordModalProps) {
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
      setError('Yeni şifre girin.');
      return;
    }
    if (newPassword.length < 4) {
      setError('Yeni şifre en az 4 karakter olmalı.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Yeni şifre ile tekrar alanı eşleşmiyor.');
      return;
    }
    if (currentUser && currentPassword && currentUser.password !== currentPassword) {
      setError('Mevcut şifre hatalı.');
      return;
    }
    if (!changePassword(newPassword)) {
      setError('Şifre güncellenemedi.');
      return;
    }
    notifications.show({ title: 'Şifre değiştirildi', message: 'Yeni şifreniz kaydedildi.', color: 'green' });
    handleClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Şifre Değiştir" size="sm" centered>
      <Stack gap="sm">
        <PasswordInput
          label="Mevcut Şifre"
          placeholder="Mevcut şifrenizi girin (isteğe bağlı)"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <PasswordInput
          label="Yeni Şifre"
          placeholder="Yeni şifre"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <PasswordInput
          label="Yeni Şifre (Tekrar)"
          placeholder="Yeni şifreyi tekrar girin"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          error={confirmPassword && newPassword !== confirmPassword ? 'Şifreler eşleşmiyor' : undefined}
        />
        {error && (
          <span style={{ fontSize: 'var(--mantine-font-size-sm)', color: 'var(--mantine-color-red-6)' }}>
            {error}
          </span>
        )}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleClose}>
            İptal
          </Button>
          <Button onClick={handleSubmit}>Kaydet</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
