import React, { useState } from 'react';
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
  NumberInput,
  PasswordInput,
  Alert,
  ActionIcon,
  Badge,
  Box,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconTrash, IconLockOff, IconEdit, IconChevronRight, IconChevronDown } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuthStore, type User, type UserRole, isUserExpired, getHierarchy } from '@shared/stores/authStore';

const ROLE_LABELS: Record<UserRole, string> = {
  Admin: 'Admin',
  Hekim: 'Hekim',
  IsgUzman: 'İSG Uzmanı',
  GenelKullanici: 'Yönetici',
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

function UserRow({
  user,
  onEdit,
  onDelete,
  onPasswordChange,
  showActions,
}: {
  user: User;
  onEdit: (u: User) => void;
  onDelete: (u: User) => void;
  onPasswordChange: (u: User) => void;
  showActions: boolean;
}) {
  return (
    <>
      <Table.Td>{[user.firstName, user.lastName].filter(Boolean).join(' ') || '—'}</Table.Td>
      <Table.Td>{user.email}</Table.Td>
      <Table.Td>{user.phone || '—'}</Table.Td>
      <Table.Td>
        <Badge variant="light" size="sm">
          {ROLE_LABELS[user.role]}
        </Badge>
      </Table.Td>
      <Table.Td>
        {isUserExpired(user) ? (
          <Badge color="red" size="sm">Süresi Dolmuş</Badge>
        ) : (
          <Badge variant="light" color="green" size="sm">Aktif</Badge>
        )}
      </Table.Td>
      {showActions && (
        <Table.Td>
          <Group gap="xs">
            <ActionIcon variant="subtle" onClick={() => onEdit(user)} title="Düzenle">
              <IconEdit size={16} />
            </ActionIcon>
            <ActionIcon variant="subtle" onClick={() => onPasswordChange(user)} title="Şifre Değiştir">
              <IconLockOff size={16} />
            </ActionIcon>
            {user.role !== 'Admin' && (
              <ActionIcon color="red" variant="subtle" onClick={() => onDelete(user)} title="Sil">
                <IconTrash size={16} />
              </ActionIcon>
            )}
          </Group>
        </Table.Td>
      )}
    </>
  );
}

function ChildTable({
  users,
  onEdit,
  onDelete,
  onPasswordChange,
}: {
  users: User[];
  onEdit: (u: User) => void;
  onDelete: (u: User) => void;
  onPasswordChange: (u: User) => void;
}) {
  if (users.length === 0) return null;
  return (
    <Table withTableBorder withColumnBorders layout="fixed" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
      <Table.Thead>
        <Table.Tr>
          <Table.Th style={{ width: '22%' }}>Ad Soyad</Table.Th>
          <Table.Th style={{ width: '22%' }}>Email</Table.Th>
          <Table.Th style={{ width: '12%' }}>Telefon</Table.Th>
          <Table.Th style={{ width: '14%' }}>Rol</Table.Th>
          <Table.Th style={{ width: '12%' }}>Durum</Table.Th>
          <Table.Th style={{ width: '18%' }}>İşlemler</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {users.map((u) => (
          <Table.Tr key={u.id}>
            <UserRow user={u} onEdit={onEdit} onDelete={onDelete} onPasswordChange={onPasswordChange} showActions />
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

export function UserManagementPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const users = useAuthStore((s) => s.users);
  const addUser = useAuthStore((s) => s.addUser);
  const updateUser = useAuthStore((s) => s.updateUser);
  const deleteUser = useAuthStore((s) => s.deleteUser);

  const { roots, children } = getHierarchy(users);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    role: 'GenelKullanici' as UserRole,
    accountExpiryDate: null as Date | null,
    subUserLimit: null as number | null,
  });

  const isAdmin = currentUser?.role === 'Admin';

  const isManagerRole = (r: UserRole) => r === 'GenelKullanici' || r === 'DemoGenel';

  const toggleExpanded = (userId: string) => {
    setExpandedRows((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const openAdd = () => {
    setEditingUser(null);
    setForm({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      password: '',
      role: 'GenelKullanici',
      accountExpiryDate: null,
      subUserLimit: null,
    });
    openModal();
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? '',
      email: user.email,
      password: '',
      role: user.role,
      accountExpiryDate: user.accountExpiryDate ? new Date(user.accountExpiryDate) : null,
      subUserLimit: user.subUserLimit ?? null,
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
    if (editingUser) {
      if (isManagerRole(form.role) && (form.subUserLimit == null || form.subUserLimit < 1)) {
        notifications.show({ title: 'Hata', message: 'Yönetici için Alt Kullanıcı / Çalışan Limiti 1 veya üzeri olmalıdır.', color: 'red' });
        return;
      }
      const ok = updateUser(editingUser.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        role: form.role,
        accountExpiryDate: form.accountExpiryDate ? form.accountExpiryDate.toISOString().slice(0, 10) : null,
        subUserLimit: isManagerRole(form.role) ? (form.subUserLimit ?? null) : null,
        ...(form.password.length >= 4 ? { password: form.password } : {}),
      });
      if (ok) {
        notifications.show({ title: 'Güncellendi', message: 'Kullanıcı güncellendi.', color: 'green' });
        closeModal();
        setEditingUser(null);
      } else {
        notifications.show({ title: 'Hata', message: 'Güncellenemedi.', color: 'red' });
      }
      return;
    }
    if (!form.password || form.password.length < 4) {
      notifications.show({ title: 'Hata', message: 'Şifre en az 4 karakter olmalı.', color: 'red' });
      return;
    }
    if (isManagerRole(form.role) && (form.subUserLimit == null || form.subUserLimit < 1)) {
      notifications.show({ title: 'Hata', message: 'Yönetici için Alt Kullanıcı / Çalışan Limiti 1 veya üzeri olmalıdır.', color: 'red' });
      return;
    }
    const added = addUser({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
      accountExpiryDate: form.accountExpiryDate ? form.accountExpiryDate.toISOString().slice(0, 10) : null,
      subUserLimit: isManagerRole(form.role) ? (form.subUserLimit ?? null) : null,
      currentWorkerCount: 0,
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

  const colCount = 6;

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>Kullanıcı Yönetimi</Title>
            <MantineText c="dimmed" size="sm">
              Yöneticiler ve alt kullanıcıları hiyerarşik olarak görüntüleyin.
            </MantineText>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd}>
            Yeni Kullanıcı
          </Button>
        </Group>

        <Paper withBorder>
          <Table.ScrollContainer minWidth={800}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 40 }} />
                  <Table.Th>Ad Soyad</Table.Th>
                  <Table.Th>Email (Kullanıcı Adı)</Table.Th>
                  <Table.Th>Telefon</Table.Th>
                  <Table.Th>Rol</Table.Th>
                  <Table.Th>Durum</Table.Th>
                  <Table.Th>İşlemler</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {roots.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={colCount + 1}>
                      <MantineText size="sm" c="dimmed" ta="center" py="md">
                        Henüz kullanıcı yok.
                      </MantineText>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  roots.map((user) => {
                    const childUsers = children[user.id] ?? [];
                    const hasChildren = childUsers.length > 0;
                    const isExpanded = expandedRows.includes(user.id);
                    return (
                      <React.Fragment key={user.id}>
                        <Table.Tr
                          style={{ cursor: hasChildren ? 'pointer' : undefined }}
                          onClick={() => hasChildren && toggleExpanded(user.id)}
                        >
                          <Table.Td
                            style={{ width: 40, verticalAlign: 'middle' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {hasChildren ? (
                              <ActionIcon
                                variant="subtle"
                                size="sm"
                                onClick={() => toggleExpanded(user.id)}
                                aria-label={isExpanded ? 'Daralt' : 'Genişlet'}
                              >
                                {isExpanded ? (
                                  <IconChevronDown size={18} />
                                ) : (
                                  <IconChevronRight size={18} />
                                )}
                              </ActionIcon>
                            ) : (
                              <Box style={{ opacity: 0.35 }} pl={2}>
                                <IconChevronRight size={18} />
                              </Box>
                            )}
                          </Table.Td>
                          <UserRow user={user} onEdit={openEdit} onDelete={handleDelete} showActions />
                        </Table.Tr>
                        {isExpanded && hasChildren && (
                          <Table.Tr>
                            <Table.Td colSpan={colCount + 1} style={{ padding: 0, verticalAlign: 'top' }}>
                              <Box p="sm" pl="xl" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                                <MantineText size="xs" fw={600} c="dimmed" mb="xs">
                                  Alt kullanıcılar ({childUsers.length})
                                </MantineText>
                                <ChildTable users={childUsers} onEdit={openEdit} onDelete={handleDelete} />
                              </Box>
                            </Table.Td>
                          </Table.Tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      </Stack>

      <Modal
        opened={modalOpened}
        onClose={() => { closeModal(); setEditingUser(null); }}
        title={editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
        size="md"
      >
        <Stack gap="sm">
          <TextInput
            label="İsim"
            placeholder="Ad"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.currentTarget.value }))}
          />
          <TextInput
            label="Soyisim"
            placeholder="Soyad"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.currentTarget.value }))}
          />
          <TextInput
            label="Telefon"
            placeholder="Telefon"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.currentTarget.value }))}
          />
          <TextInput
            label="Email (Kullanıcı Adı)"
            placeholder="ornek@firma.com"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.currentTarget.value }))}
            required
            disabled={!!editingUser}
          />
          <PasswordInput
            label="Şifre"
            placeholder={editingUser ? 'Değiştirmek için doldurun (opsiyonel)' : 'Şifre'}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.currentTarget.value }))}
            required={!editingUser}
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
          {isManagerRole(form.role) && (
            <NumberInput
              label="Alt Kullanıcı / Çalışan Limiti"
              description="Bu yöneticinin ekleyebileceği maksimum çalışan sayısı."
              placeholder="Örn: 50"
              min={1}
              value={form.subUserLimit ?? ''}
              onChange={(v) => setForm((f) => ({ ...f, subUserLimit: typeof v === 'number' ? v : null }))}
            />
          )}
          <DatePickerInput
            label="Hesap Geçerlilik Tarihi"
            placeholder="Tarih seçin (boş bırakılırsa süresiz)"
            valueFormat="DD.MM.YYYY"
            value={form.accountExpiryDate}
            onChange={(d) => setForm((f) => ({ ...f, accountExpiryDate: d }))}
            clearable
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => { closeModal(); setEditingUser(null); }}>
              İptal
            </Button>
            <Button onClick={handleSave}>Kaydet</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
