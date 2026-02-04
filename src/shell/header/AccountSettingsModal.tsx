import { Modal, Stack, TextInput, Button, Group, Alert, Text } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useAuthStore, type UserRole } from '@shared/stores/authStore';

const ROLE_LABELS: Record<UserRole, string> = {
  Admin: 'Admin',
  Hekim: 'Hekim',
  IsgUzman: 'İSG Uzmanı',
  GenelKullanici: 'Genel Kullanıcı',
  DemoHekim: 'Demo Hekim',
  DemoUzman: 'Demo Uzman',
  DemoGenel: 'Demo Genel',
};

interface AccountSettingsModalProps {
  opened: boolean;
  onClose: () => void;
}

export function AccountSettingsModal({ opened, onClose }: AccountSettingsModalProps) {
  const currentUser = useAuthStore((s) => s.currentUser);

  const roleLabel = currentUser ? ROLE_LABELS[currentUser.role] ?? currentUser.role : '—';

  return (
    <Modal opened={opened} onClose={onClose} title="Hesap Ayarları" size="sm" centered>
      <Stack gap="sm">
        <TextInput
          label="Ad"
          value={currentUser?.firstName ?? ''}
          readOnly
          variant="filled"
        />
        <TextInput
          label="Soyad"
          value={currentUser?.lastName ?? ''}
          readOnly
          variant="filled"
        />
        <TextInput
          label="E-posta"
          value={currentUser?.email ?? ''}
          readOnly
          variant="filled"
        />
        <TextInput
          label="Telefon"
          value={currentUser?.phone ?? '—'}
          readOnly
          variant="filled"
        />
        <TextInput
          label="Rol"
          value={roleLabel}
          readOnly
          variant="filled"
        />

        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" mt="sm">
          <Text size="sm">
            Bilgilerinizde değişiklik yapmak için lütfen Sistem Yöneticisi ile iletişime geçiniz.
          </Text>
        </Alert>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Kapat
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
