import { useState } from 'react';
import {
  Title,
  Text as MantineText,
  Button,
  Group,
  Stack,
  Paper,
  Table,
  Modal,
  TextInput,
  Select,
  PasswordInput,
  Alert,
  ActionIcon,
  Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconTrash, IconLockOff } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuthStore, type User, type UserRole } from '@shared/stores/authStore';

const ROLE_LABELS: Record<UserRole, string> = {
  Admin: 'Admin',
  Hekim: 'Hekim',
  IsgUzman: 'İSG Uzmanı',
  GenelKullanici: 'Genel Kullanıcı',
  DemoHekim: 'Demo Hekim',
  DemoUzman: 'Demo Uzman',
  DemoGenel: 'Demo Genel',
};

const ROLE_SELECT_DATA: { group: string; items: { value: UserRole; label: string }[] }[] = [
  {
    group: 'Standart (Boş) Hesaplar',
    items: [
      { value: 'Hekim', label: ROLE_LABELS.Hekim },
      { value: 'IsgUzman', label: ROLE_LABELS.IsgUzman },
      { value: 'GenelKullanici', label: ROLE_LABELS.GenelKullanici },
    ],
  },
  {
    group: 'Demo (Dolu) Hesaplar',
    items: [
      { value: 'DemoHekim', label: ROLE_LABELS.DemoHekim },
      { value: 'DemoUzman', label: ROLE_LABELS.DemoUzman },
      { value: 'DemoGenel', label: ROLE_LABELS.DemoGenel },
    ],
  },
  {
    group: 'Yönetim',
    items: [{ value: 'Admin', label: ROLE_LABELS.Admin }],
  },
];

export function UserManagementPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const users = useAuthStore((s) => s.users);
  const addUser = useAuthStore((s) => s.addUser);
  const deleteUser = useAuthStore((s) => s.deleteUser);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    role: 'GenelKullanici' as UserRole,
  });

  const isAdmin = currentUser?.role === 'Admin';

  const openAdd = () => {
    setForm({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      password: '',
      role: 'GenelKullanici',
    });
    openModal();
  };

  const handleSave = () => {
    const email = form.email.trim().toLowerCase();
    if (!email) {
      notifications.show({ title: 'Hata', message: 'Email (kullanıcı adı) girin.', color: 'red' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      notifications.show({ title: 'Hata', message: 'Geçerli bir email adresi girin.', color: 'red' });
      return;
    }
    if (!form.password || form.password.length < 4) {
      notifications.show({ title: 'Hata', message: 'Şifre en az 4 karakter olmalı.', color: 'red' });
      return;
    }
    const added = addUser({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
    });
    if (added) {
      notifications.show({ title: 'Kullanıcı eklendi', message: `${form.email} listeye eklendi.`, color: 'green' });
      closeModal();
    } else {
      notifications.show({ title: 'Hata', message: 'Eklenemedi. Yetkiniz yok veya email zaten kayıtlı.', color: 'red' });
    }
  };

  const handleDelete = (user: User) => {
    if (user.role === 'Admin') {
      notifications.show({ title: 'Hata', message: 'Admin kullanıcı silinemez.', color: 'red' });
      return;
    }
    if (!window.confirm(`"${user.email}" kullanıcısını silmek istediğinize emin misiniz?`)) return;
    if (deleteUser(user.id)) {
      notifications.show({ title: 'Silindi', message: 'Kullanıcı kaldırıldı.', color: 'green' });
    }
  };

  if (!isAdmin) {
    return (
      <Stack gap="md">
        <Alert icon={<IconLockOff size={20} />} title="Erişim reddedildi" color="red">
          Bu sayfayı görüntülemek için Admin yetkisi gerekir.
        </Alert>
      </Stack>
    );
  }

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>Kullanıcı Yönetimi</Title>
            <MantineText c="dimmed" size="sm">
              Sistem kullanıcılarını yönetin.
            </MantineText>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd}>
            Yeni Kullanıcı
          </Button>
        </Group>

        <Paper withBorder>
          <Table.ScrollContainer minWidth={700}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Ad Soyad</Table.Th>
                  <Table.Th>Email (Kullanıcı Adı)</Table.Th>
                  <Table.Th>Telefon</Table.Th>
                  <Table.Th>Rol</Table.Th>
                  <Table.Th>İşlemler</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <MantineText size="sm" c="dimmed" ta="center" py="md">
                        Henüz kullanıcı yok.
                      </MantineText>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  users.map((u) => (
                    <Table.Tr key={u.id}>
                      <Table.Td>{[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}</Table.Td>
                      <Table.Td>{u.email}</Table.Td>
                      <Table.Td>{u.phone || '—'}</Table.Td>
                      <Table.Td>
                        <Badge variant="light" size="sm">
                          {ROLE_LABELS[u.role]}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {u.role !== 'Admin' && (
                          <ActionIcon color="red" variant="subtle" onClick={() => handleDelete(u)} title="Sil">
                            <IconTrash size={16} />
                          </ActionIcon>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      </Stack>

      <Modal opened={modalOpened} onClose={closeModal} title="Yeni Kullanıcı" size="md">
        <Stack gap="sm">
          <TextInput
            label="İsim"
            placeholder="Ad"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
          />
          <TextInput
            label="Soyisim"
            placeholder="Soyad"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
          />
          <TextInput
            label="Telefon"
            placeholder="Telefon"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <TextInput
            label="Email (Kullanıcı Adı)"
            placeholder="ornek@firma.com"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <PasswordInput
            label="Şifre"
            placeholder="Şifre"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
          />
          <Select
            label="Rol"
            placeholder="Kullanıcı rolünü seçiniz"
            searchable
            nothingFoundMessage="Rol bulunamadı"
            allowDeselect={false}
            data={ROLE_SELECT_DATA}
            value={form.role}
            onChange={(v) => v && setForm((f) => ({ ...f, role: v as UserRole }))}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeModal}>
              İptal
            </Button>
            <Button onClick={handleSave}>Kaydet</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
