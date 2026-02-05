import { useMemo, useState } from 'react';
import {
  Title,
  Text,
  Button,
  Group,
  Stack,
  Paper,
  Table,
  ActionIcon,
  Menu,
  SimpleGrid,
  Modal,
  NumberInput,
  Textarea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconDots, IconEdit, IconTrash, IconMinus, IconPlus as IconPlusSmall } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  usePharmacyStore,
  type MedicalItem,
  type MedicalCategory,
  type MedicalUnit,
  type TransactionType,
} from '../stores/pharmacyStore';
import { useAuthStore } from '@shared/stores/authStore';
import { PharmacyModal, CATEGORY_OPTIONS, UNIT_OPTIONS } from '../components/PharmacyModal';

const CATEGORY_LABELS: Record<MedicalCategory, string> = {
  DRUG: 'İlaç',
  CONSUMABLE: 'Sarf',
  EQUIPMENT: 'Ekipman',
};

const UNIT_LABELS: Record<MedicalUnit, string> = {
  BOX: 'Kutu',
  PIECE: 'Adet',
  AMPULE: 'Ampul',
  LITER: 'Litre',
};

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('tr-TR');
}

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const out = new Date(date);
  out.setMonth(out.getMonth() + months);
  return out;
}

function isExpired(expiryDate: Date | string): boolean {
  const exp = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  return exp.getTime() < todayStart().getTime();
}

function isExpiringWithinMonths(expiryDate: Date | string, months: number): boolean {
  const exp = typeof expiryDate === 'string' ? new Date(expiryDate) : new Date(expiryDate);
  const today = todayStart();
  const limit = addMonths(today, months);
  return exp.getTime() >= today.getTime() && exp.getTime() <= limit.getTime();
}

interface AdjustStockModalProps {
  opened: boolean;
  onClose: () => void;
  item: MedicalItem | null;
  type: TransactionType;
  onDone: () => void;
}

function AdjustStockModal({ opened, onClose, item, type, onDone }: AdjustStockModalProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const adjustStock = usePharmacyStore((s) => s.adjustStock);
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('');

  const performedBy = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email
    : 'Sistem';

  const handleSubmit = () => {
    if (!item || quantity <= 0) return;
    if (type === 'OUT' && quantity > item.stockQuantity) {
      notifications.show({
        title: 'Yetersiz stok',
        message: `Mevcut stok: ${item.stockQuantity}`,
        color: 'red',
      });
      return;
    }
    if (!reason.trim()) {
      notifications.show({ title: 'Gerekçe girin', message: '', color: 'yellow' });
      return;
    }
    adjustStock(item.id, quantity, type, reason.trim(), performedBy);
    notifications.show({
      title: type === 'IN' ? 'Stok eklendi' : 'Stok düşüldü',
      message: '',
      color: 'green',
    });
    setQuantity(1);
    setReason('');
    onDone();
    onClose();
  };

  const handleClose = () => {
    setQuantity(1);
    setReason('');
    onClose();
  };

  if (!item) return null;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={type === 'IN' ? 'Stok Ekle' : 'Stok Düş'}
      size="sm"
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {item.name} — Mevcut: {item.stockQuantity} {UNIT_LABELS[item.unit]}
        </Text>
        <NumberInput
          label="Miktar"
          min={1}
          max={type === 'OUT' ? item.stockQuantity : undefined}
          value={quantity}
          onChange={(v) => setQuantity(typeof v === 'string' ? parseInt(v, 10) || 0 : v)}
        />
        <Textarea
          label="Gerekçe"
          placeholder="Örn: Poliklinik kullanımı"
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
          minRows={2}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={handleClose}>
            İptal
          </Button>
          <Button
            color={type === 'IN' ? 'green' : 'red'}
            onClick={handleSubmit}
          >
            {type === 'IN' ? 'Ekle' : 'Düş'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export function PharmacyPage() {
  const items = usePharmacyStore((s) => s.items);
  const deleteItem = usePharmacyStore((s) => s.deleteItem);
  const getExpiredItems = usePharmacyStore((s) => s.getExpiredItems);
  const getLowStockItems = usePharmacyStore((s) => s.getLowStockItems);

  const [itemModalOpened, { open: openItemModal, close: closeItemModal }] = useDisclosure(false);
  const [editingItem, setEditingItem] = useState<MedicalItem | null>(null);
  const [adjustModalOpened, { open: openAdjustModal, close: closeAdjustModal }] = useDisclosure(false);
  const [adjustItem, setAdjustItem] = useState<MedicalItem | null>(null);
  const [adjustType, setAdjustType] = useState<TransactionType>('OUT');

  const totalItems = items.length;
  const lowStockCount = useMemo(() => getLowStockItems().length, [items, getLowStockItems]);
  const expiredCount = useMemo(() => getExpiredItems().length, [items, getExpiredItems]);

  const handleAdd = () => {
    setEditingItem(null);
    openItemModal();
  };

  const handleEdit = (item: MedicalItem) => {
    setEditingItem(item);
    openItemModal();
  };

  const handleStokDus = (item: MedicalItem) => {
    setAdjustItem(item);
    setAdjustType('OUT');
    openAdjustModal();
  };

  const handleStokEkle = (item: MedicalItem) => {
    setAdjustItem(item);
    setAdjustType('IN');
    openAdjustModal();
  };

  const handleItemModalClose = () => {
    closeItemModal();
    setEditingItem(null);
  };

  const handleAdjustClose = () => {
    closeAdjustModal();
    setAdjustItem(null);
  };

  const handleDelete = (item: MedicalItem) => {
    modals.openConfirmModal({
      title: 'Stok kalemini sil',
      children: (
        <Text size="sm">
          "{item.name}" kalemi ve tüm hareket kayıtları silinecek.
        </Text>
      ),
      labels: { confirm: 'Sil', cancel: 'İptal' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        deleteItem(item.id);
        notifications.show({ title: 'Kalem silindi', message: '', color: 'gray' });
      },
    });
  };

  const getRowStyle = (item: MedicalItem) => {
    const exp = item.expiryDate instanceof Date ? item.expiryDate : new Date(item.expiryDate);
    if (isExpired(exp)) return { backgroundColor: 'var(--mantine-color-red-light)' };
    if (isExpiringWithinMonths(exp, 3)) return { backgroundColor: 'var(--mantine-color-yellow-light)' };
    return {};
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between" wrap="wrap">
          <div>
            <Title order={2}>Ecza Dolabı Stok</Title>
            <Text c="dimmed" size="sm">
              İlaç ve sarf stok takibi, miad uyarıları
            </Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
            Yeni Stok Kalemi
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Paper withBorder p="md">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Toplam Kalem
            </Text>
            <Text size="xl" fw={700}>
              {totalItems}
            </Text>
          </Paper>
          <Paper withBorder p="md">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Kritik Seviye
            </Text>
            <Text size="xl" fw={700} c={lowStockCount > 0 ? 'red' : undefined}>
              {lowStockCount}
            </Text>
            <Text size="xs" c="dimmed">Stok kritik seviyenin altında</Text>
          </Paper>
          <Paper withBorder p="md">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Miadı Dolanlar
            </Text>
            <Text size="xl" fw={700} c={expiredCount > 0 ? 'red' : undefined}>
              {expiredCount}
            </Text>
            <Text size="xs" c="dimmed">Son kullanma tarihi geçmiş</Text>
          </Paper>
        </SimpleGrid>

        <Paper withBorder>
          <Table.ScrollContainer minWidth={800}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>İlaç Adı</Table.Th>
                  <Table.Th>Kategori</Table.Th>
                  <Table.Th>Miktar (Birim)</Table.Th>
                  <Table.Th>Lokasyon</Table.Th>
                  <Table.Th>Son Kul. Tarihi</Table.Th>
                  <Table.Th style={{ width: 120 }}>İşlemler</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text size="sm" c="dimmed" ta="center" py="md">
                        Henüz stok kalemi yok.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  items.map((item) => {
                    const exp = item.expiryDate instanceof Date ? item.expiryDate : new Date(item.expiryDate);
                    const isLow = item.stockQuantity <= item.criticalThreshold;
                    return (
                      <Table.Tr key={item.id} style={getRowStyle(item)}>
                        <Table.Td>{item.name}</Table.Td>
                        <Table.Td>{CATEGORY_LABELS[item.category]}</Table.Td>
                        <Table.Td>
                          <Text
                            span
                            fw={isLow ? 700 : undefined}
                            c={isLow ? 'red' : undefined}
                          >
                            {item.stockQuantity} {UNIT_LABELS[item.unit]}
                          </Text>
                        </Table.Td>
                        <Table.Td>{item.location || '—'}</Table.Td>
                        <Table.Td>{formatDate(exp)}</Table.Td>
                        <Table.Td>
                          <Group gap="xs" wrap="nowrap">
                            <Button
                              size="xs"
                              variant="light"
                              color="green"
                              leftSection={<IconPlusSmall size={14} />}
                              onClick={() => handleStokEkle(item)}
                            >
                              Stok Ekle
                            </Button>
                            <Button
                              size="xs"
                              variant="light"
                              color="red"
                              leftSection={<IconMinus size={14} />}
                              onClick={() => handleStokDus(item)}
                              disabled={item.stockQuantity <= 0}
                            >
                              Stok Düş
                            </Button>
                            <Menu shadow="md" width={140} position="bottom-end">
                              <Menu.Target>
                                <ActionIcon variant="subtle" size="sm">
                                  <IconDots size={16} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Item
                                  leftSection={<IconEdit size={14} />}
                                  onClick={() => handleEdit(item)}
                                >
                                  Düzenle
                                </Menu.Item>
                                <Menu.Item
                                  leftSection={<IconTrash size={14} />}
                                  color="red"
                                  onClick={() => handleDelete(item)}
                                >
                                  Sil
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      </Stack>

      <PharmacyModal
        opened={itemModalOpened}
        onClose={handleItemModalClose}
        item={editingItem}
        onSaved={() => {}}
      />

      <AdjustStockModal
        opened={adjustModalOpened}
        onClose={handleAdjustClose}
        item={adjustItem}
        type={adjustType}
        onDone={() => {}}
      />
    </>
  );
}
